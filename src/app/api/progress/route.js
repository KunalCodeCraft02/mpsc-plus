import {
  connectDb,
  ser,
  Lecture,
  LectureProgress,
  Enrollment,
  Course,
} from "@/db";
import { handler, body, ok, fail } from "@/server/http";
import { requireAuth } from "@/server/auth";
import { awardXp, touchStreak, recomputeBadges, grantBadge } from "@/server/gamification";
import { progressSchema } from "@/server/validation";

/**
 * How many published lectures matching `lectureFilter` exist, and how many of
 * them this user has completed. Replaces the old LEFT JOIN + FILTER aggregate.
 */
async function completionStats(userId, lectureFilter) {
  const ids = (
    await Lecture.find({ ...lectureFilter, published: true }, { _id: 1 }).lean()
  ).map((l) => l._id);
  if (!ids.length) return { total: 0, done: 0 };
  const done = await LectureProgress.countDocuments({
    userId,
    completed: true,
    lectureId: { $in: ids },
  });
  return { total: ids.length, done };
}

/**
 * Lecture progress + XP. XP is derived here from a verified activity — the
 * client can never post an XP amount.
 */
export const POST = handler(async (request) => {
  const user = await requireAuth(request);
  const data = progressSchema.parse(await body(request));

  await connectDb();
  const lecture = await Lecture.findById(data.lectureId).lean();
  if (!lecture || !lecture.published) return fail(404, "Lecture not found");

  const course = await Course.findById(lecture.courseId).lean();
  const enrollment = await Enrollment.findOne({
    userId: user.id,
    courseId: lecture.courseId,
  }).lean();

  if (!enrollment && !course?.isFree && !lecture.isFree) {
    return fail(403, "Enrol in this course first.");
  }

  if (!enrollment && (course?.isFree || lecture.isFree)) {
    try {
      await Enrollment.create({ userId: user.id, courseId: lecture.courseId });
    } catch (err) {
      if (err?.code !== 11000) throw err;
    }
  }

  const completed = !!data.completed || data.percent >= 95;
  const positionSec = Math.round(data.positionSec);
  const percent = Math.round(data.percent);
  const now = new Date();

  // Upsert keeping the best-so-far values (the old ON CONFLICT ... greatest()).
  let doc = await LectureProgress.findOne({ userId: user.id, lectureId: lecture._id });
  let existed = !!doc;
  if (!doc) {
    try {
      doc = await LectureProgress.create({
        userId: user.id,
        courseId: lecture.courseId,
        lectureId: lecture._id,
        positionSec,
        percent,
        completed,
        completedAt: completed ? now : null,
        updatedAt: now,
      });
    } catch (err) {
      if (err?.code !== 11000) throw err;
      // Lost a race against a concurrent request — merge into the winner.
      doc = await LectureProgress.findOne({ userId: user.id, lectureId: lecture._id });
      existed = true;
    }
  }
  if (existed) {
    doc.positionSec = Math.max(doc.positionSec ?? 0, positionSec);
    doc.percent = Math.max(doc.percent ?? 0, percent);
    doc.completed = doc.completed || completed;
    doc.completedAt = doc.completedAt ?? (completed ? now : null);
    doc.updatedAt = now;
    await doc.save();
  }
  const row = ser(doc.toObject());

  let xpEarned = 0;
  const badges = [];

  if (row.completed) {
    xpEarned += await awardXp(user.id, "lecture_complete", `lecture-${lecture._id}`);
    const streak = await touchStreak(user.id);
    xpEarned += streak.bonus;

    // Chapter completion bonus
    if (lecture.chapterId) {
      const chapterStats = await completionStats(user.id, { chapterId: lecture.chapterId });
      if (chapterStats.total > 0 && chapterStats.total === chapterStats.done) {
        xpEarned += await awardXp(
          user.id,
          "chapter_complete_bonus",
          `chapter-${lecture.chapterId}`,
        );
      }
    }

    // Course progress + completion bonus
    const courseStats = await completionStats(user.id, { courseId: lecture.courseId });
    const percentDone = courseStats.total
      ? Math.round((courseStats.done / courseStats.total) * 100)
      : 0;

    await Enrollment.updateOne(
      { userId: user.id, courseId: lecture.courseId },
      { $set: { progressPercent: percentDone } },
    );

    if (percentDone >= 100) {
      xpEarned += await awardXp(
        user.id,
        "course_complete_bonus",
        `course-${lecture.courseId}`,
      );
      const b = await grantBadge(user.id, "course_completed");
      if (b) badges.push(b);
    }

    badges.push(...(await recomputeBadges(user.id)));
  }

  return ok({ progress: row, xpEarned, badges });
});
