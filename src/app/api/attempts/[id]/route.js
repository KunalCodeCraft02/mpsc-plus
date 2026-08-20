import { connectDb, ser, QuizAttempt, Quiz, Course } from "@/db";
import { handler, ok, fail } from "@/server/http";
import { requireAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const user = await requireAuth(request);

  await connectDb();
  const found = await QuizAttempt.findOne({ _id: Number(id), userId: user.id }).lean();
  if (!found) return fail(404, "Result not found");
  const attempt = ser(found);

  const quiz = ser(await Quiz.findById(attempt.quizId).lean());
  const course = quiz ? ser(await Course.findById(quiz.courseId).lean()) : null;

  return ok({
    attempt: {
      ...attempt,
      review: attempt.answers?.review || [],
    },
    quiz: quiz
      ? {
          id: quiz.id,
          title: quiz.title,
          titleMr: quiz.titleMr,
          difficulty: quiz.difficulty,
          passingPercent: quiz.passingPercent,
          timeLimitMin: quiz.timeLimitMin,
        }
      : null,
    course: course ? { id: course.id, title: course.title, titleMr: course.titleMr } : null,
  });
});
