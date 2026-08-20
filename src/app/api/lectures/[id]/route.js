import {
  connectDb,
  ser,
  Lecture,
  Course,
  Chapter,
  Subject,
  Pdf,
  Enrollment,
  LectureProgress,
} from "@/db";
import { handler, ok, fail } from "@/server/http";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const lectureId = Number(id);
  if (!Number.isFinite(lectureId)) return fail(400, "Invalid lecture id");

  await connectDb();
  const lectureDoc = await Lecture.findById(lectureId).lean();
  if (!lectureDoc || !lectureDoc.published) return fail(404, "Lecture not found");
  const lecture = ser(lectureDoc);

  const courseDoc = await Course.findById(lecture.courseId).lean();
  const course = courseDoc ? ser(courseDoc) : null;
  const user = await currentUser(request);

  let enrollment = null;
  if (user) {
    const e = await Enrollment.findOne({
      userId: user.id,
      courseId: lecture.courseId,
    }).lean();
    enrollment = e ? ser(e) : null;
  }

  const hasAccess = course?.isFree || lecture.isFree || !!enrollment || user?.role === "ADMIN";
  if (!hasAccess) {
    return fail(403, "Enrol in this course to watch this lecture.", {
      locked: true,
      courseId: lecture.courseId,
    });
  }

  const siblings = ser(
    await Lecture.find(
      { courseId: lecture.courseId, published: true },
      {
        title: 1,
        titleMr: 1,
        chapterId: 1,
        durationMin: 1,
        isFree: 1,
        orderIndex: 1,
        youtubeId: 1,
      },
    )
      .sort({ chapterId: 1, orderIndex: 1, _id: 1 })
      .lean(),
  );

  const chapter = lecture.chapterId
    ? ser(await Chapter.findById(lecture.chapterId).lean())
    : null;
  const subject = lecture.subjectId
    ? ser(await Subject.findById(lecture.subjectId).lean())
    : null;

  const chapterRows = ser(
    await Chapter.find({ courseId: lecture.courseId })
      .sort({ orderIndex: 1, _id: 1 })
      .lean(),
  );

  const attachedPdfs = lecture.chapterId
    ? ser(await Pdf.find({ chapterId: lecture.chapterId, published: true }).lean())
    : [];

  let progress = null;
  let progressMap = {};
  if (user) {
    const rows = ser(
      await LectureProgress.find({ userId: user.id, courseId: lecture.courseId }).lean(),
    );
    progressMap = Object.fromEntries(rows.map((r) => [r.lectureId, r]));
    progress = progressMap[lectureId] || null;
  }

  const idx = siblings.findIndex((s) => s.id === lectureId);
  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;

  return ok({
    lecture,
    course: course
      ? {
          id: course.id,
          title: course.title,
          titleMr: course.titleMr,
          isFree: course.isFree,
        }
      : null,
    chapter,
    subject,
    chapters: chapterRows.map((c) => ({
      ...c,
      lectures: siblings
        .filter((s) => s.chapterId === c.id)
        .map((s) => ({
          ...s,
          completed: !!progressMap[s.id]?.completed,
          progress: progressMap[s.id]?.percent || 0,
        })),
    })),
    pdfs: attachedPdfs,
    prev: idx > 0 ? siblings[idx - 1] : null,
    next: idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null,
    progress,
    courseProgressPercent: siblings.length
      ? Math.round((completedCount / siblings.length) * 100)
      : 0,
  });
});
