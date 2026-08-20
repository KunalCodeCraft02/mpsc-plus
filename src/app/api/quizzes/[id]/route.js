import { connectDb, ser, Quiz, Question, Course, Enrollment, QuizAttempt } from "@/db";
import { handler, ok, fail } from "@/server/http";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

/**
 * Returns the quiz paper WITHOUT correct answers or explanations so the
 * answer key can never be scraped from the network response.
 */
export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const quizId = Number(id);
  if (!Number.isFinite(quizId)) return fail(400, "Invalid test id");

  await connectDb();
  const quizDoc = await Quiz.findById(quizId).lean();
  if (!quizDoc || !quizDoc.published) return fail(404, "Test not found");
  const quiz = ser(quizDoc);

  const user = await currentUser(request);
  const course = ser(await Course.findById(quiz.courseId).lean());

  let enrollment = null;
  if (user) {
    const e = await Enrollment.findOne({ userId: user.id, courseId: quiz.courseId }).lean();
    enrollment = e ? ser(e) : null;
  }

  const hasAccess = quiz.isFree || course?.isFree || !!enrollment || user?.role === "ADMIN";
  if (!hasAccess) {
    return fail(403, "Enrol in this course to attempt this test.", {
      locked: true,
      courseId: quiz.courseId,
    });
  }

  const rows = ser(
    await Question.find(
      { quizId },
      {
        orderIndex: 1,
        text: 1,
        textMr: 1,
        options: 1,
        optionsMr: 1,
        marks: 1,
        negativeMarks: 1,
      },
    )
      .sort({ orderIndex: 1, _id: 1 })
      .lean(),
  );

  let lastAttempt = null;
  if (user) {
    const a = await QuizAttempt.findOne({ userId: user.id, quizId })
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    lastAttempt = a ? ser(a) : null;
  }

  return ok({
    quiz: {
      ...quiz,
      courseTitle: course?.title,
      courseTitleMr: course?.titleMr,
      questionCount: rows.length,
      totalMarks: rows.reduce((s, r) => s + Number(r.marks || 0), 0),
    },
    questions: rows,
    lastAttempt,
  });
});
