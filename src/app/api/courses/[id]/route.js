import {
  connectDb,
  ser,
  Course,
  Subject,
  Chapter,
  Lecture,
  Pdf,
  Quiz,
  Question,
  Enrollment,
  LectureProgress,
} from "@/db";
import { handler, ok, fail } from "@/server/http";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId)) return fail(400, "Invalid course id");

  await connectDb();
  const courseDoc = await Course.findById(courseId).lean();
  if (!courseDoc || !courseDoc.published) return fail(404, "Course not found");
  const course = ser(courseDoc);

  const user = await currentUser(request);

  const [subjectRows, chapterRows, lectureRows, pdfRows, quizRows, studentCount] =
    await Promise.all([
      Subject.find({ courseId }).sort({ orderIndex: 1, _id: 1 }).lean(),
      Chapter.find({ courseId }).sort({ orderIndex: 1, _id: 1 }).lean(),
      Lecture.find({ courseId, published: true }).sort({ orderIndex: 1, _id: 1 }).lean(),
      Pdf.find({ courseId, published: true }).sort({ orderIndex: 1, _id: 1 }).lean(),
      Quiz.find(
        { courseId, published: true },
        {
          title: 1,
          titleMr: 1,
          difficulty: 1,
          timeLimitMin: 1,
          isFree: 1,
          passingPercent: 1,
        },
      ).lean(),
      Enrollment.countDocuments({ courseId }),
    ]);

  const subjectList = ser(subjectRows);
  const chapterList = ser(chapterRows);
  const lectureList = ser(lectureRows);
  const pdfList = ser(pdfRows);
  const quizList = ser(quizRows);

  // Question counts for the quiz cards.
  if (quizList.length) {
    const counts = await Question.aggregate([
      { $match: { quizId: { $in: quizList.map((q) => q.id) } } },
      { $group: { _id: "$quizId", n: { $sum: 1 } } },
    ]);
    const map = new Map(counts.map((c) => [c._id, c.n]));
    for (const q of quizList) q.questionCount = map.get(q.id) ?? 0;
  }

  let enrollment = null;
  let progressMap = {};
  if (user) {
    const e = await Enrollment.findOne({ userId: user.id, courseId }).lean();
    enrollment = e ? ser(e) : null;
    const prog = ser(await LectureProgress.find({ userId: user.id, courseId }).lean());
    progressMap = Object.fromEntries(prog.map((p) => [p.lectureId, p]));
  }

  const hasAccess = course.isFree || !!enrollment || user?.role === "ADMIN";

  const curriculum = subjectList.map((s) => ({
    ...s,
    chapters: chapterList
      .filter((c) => c.subjectId === s.id)
      .map((c) => ({
        ...c,
        lectures: lectureList
          .filter((l) => l.chapterId === c.id)
          .map((l) => ({
            ...l,
            locked: !hasAccess && !l.isFree,
            progress: progressMap[l.id]?.percent || 0,
            completed: !!progressMap[l.id]?.completed,
          })),
        pdfs: pdfList
          .filter((p) => p.chapterId === c.id)
          .map((p) => ({ ...p, locked: !hasAccess && !p.isFree })),
      })),
  }));

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;
  const progressPercent = lectureList.length
    ? Math.round((completedCount / lectureList.length) * 100)
    : 0;

  return ok({
    course: {
      ...course,
      lectureCount: lectureList.length,
      pdfCount: pdfList.length,
      quizCount: quizList.length,
      studentCount,
      totalDurationMin: lectureList.reduce((s, l) => s + (l.durationMin || 0), 0),
    },
    curriculum,
    quizzes: quizList.map((q) => ({ ...q, locked: !hasAccess && !q.isFree })),
    pdfs: pdfList.map((p) => ({ ...p, locked: !hasAccess && !p.isFree })),
    enrollment,
    isPurchased: !!enrollment,
    hasAccess,
    progressPercent,
    nextLecture:
      lectureList.find((l) => !progressMap[l.id]?.completed && (hasAccess || l.isFree)) ||
      lectureList[0] ||
      null,
  });
});
