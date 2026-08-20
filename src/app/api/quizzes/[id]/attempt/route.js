import { connectDb, ser, Quiz, Question, Course, Enrollment, QuizAttempt } from "@/db";
import { handler, body, ok, fail } from "@/server/http";
import { requireAuth } from "@/server/auth";
import { attemptSchema } from "@/server/validation";
import { awardXp, touchStreak, recomputeBadges } from "@/server/gamification";
import { XP_RULES } from "@/lib/config";

/**
 * Backend-only evaluation. The client submits selected option indexes; the
 * score, marks and pass/fail are computed here from the stored answer key.
 */
export const POST = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const quizId = Number(id);
  if (!Number.isFinite(quizId)) return fail(400, "Invalid test id");

  const user = await requireAuth(request);
  const data = attemptSchema.parse(await body(request));

  await connectDb();
  const quiz = ser(await Quiz.findById(quizId).lean());
  if (!quiz || !quiz.published) return fail(404, "Test not found");

  const course = ser(await Course.findById(quiz.courseId).lean());
  const enrollment = await Enrollment.findOne({
    userId: user.id,
    courseId: quiz.courseId,
  }).lean();

  const hasAccess = quiz.isFree || course?.isFree || !!enrollment || user.role === "ADMIN";
  if (!hasAccess) return fail(403, "Enrol in this course to attempt this test.");

  // Throttle accidental duplicate submissions (double-tap / retry storms).
  const recent = await QuizAttempt.findOne(
    { userId: user.id, quizId },
    { createdAt: 1 },
  )
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  if (recent && Date.now() - new Date(recent.createdAt).getTime() < 8000) {
    return ok({ attemptId: recent._id, duplicate: true });
  }

  const key = ser(
    await Question.find({ quizId }).sort({ orderIndex: 1, _id: 1 }).lean(),
  );

  if (!key.length) return fail(409, "This test has no questions yet.");

  let score = 0;
  let totalMarks = 0;
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const review = [];

  for (const q of key) {
    const marks = Number(q.marks || 0);
    const neg = Number(q.negativeMarks || 0);
    totalMarks += marks;
    const raw = data.answers[String(q.id)];
    const selected = raw == null || raw < 0 ? null : Number(raw);

    let state = "unanswered";
    if (selected == null) {
      unanswered += 1;
    } else if (selected === q.correctIndex) {
      score += marks;
      correct += 1;
      state = "correct";
    } else {
      score -= neg;
      incorrect += 1;
      state = "incorrect";
    }

    review.push({
      questionId: q.id,
      orderIndex: q.orderIndex,
      text: q.text,
      textMr: q.textMr,
      options: q.options,
      optionsMr: q.optionsMr,
      correctIndex: q.correctIndex,
      selectedIndex: selected,
      explanation: q.explanation,
      marks,
      negativeMarks: neg,
      state,
    });
  }

  score = Math.max(0, score);
  const percent = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
  const passed = percent >= Number(quiz.passingPercent || 0);
  const timeCap = Number(quiz.timeLimitMin || 0) * 60 + 120;
  const timeTakenSec = Math.min(Math.round(data.timeTakenSec), timeCap || 999999);

  const attempt = ser(
    (
      await QuizAttempt.create({
        userId: user.id,
        quizId,
        courseId: quiz.courseId,
        score,
        totalMarks,
        percent,
        correct,
        incorrect,
        unanswered,
        timeTakenSec,
        passed,
        answers: { selected: data.answers, review },
      })
    ).toObject(),
  );

  /* XP — derived server-side from the verified result */
  let xpEarned = 0;
  xpEarned += await awardXp(user.id, "quiz_attempt", `quiz-${quizId}-${attempt.id}`);
  if (correct > 0) {
    xpEarned += await awardXp(
      user.id,
      "quiz_correct_answer",
      `quiz-correct-${attempt.id}`,
      correct * XP_RULES.quiz_correct_answer,
    );
  }
  if (percent >= 80) {
    xpEarned += await awardXp(user.id, "quiz_high_score_bonus", `quiz-high-${attempt.id}`);
  }
  if (percent >= 100) {
    xpEarned += await awardXp(user.id, "quiz_perfect_bonus", `quiz-perfect-${attempt.id}`);
  }
  const streak = await touchStreak(user.id);
  xpEarned += streak.bonus;
  const badges = await recomputeBadges(user.id);

  try {
    await Enrollment.create({ userId: user.id, courseId: quiz.courseId });
  } catch (err) {
    if (err?.code !== 11000) throw err;
  }

  return ok({ attemptId: attempt.id, xpEarned, badges, streak });
});

export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const user = await requireAuth(request);
  await connectDb();
  const quizId = Number(id);

  const rows = ser(
    await QuizAttempt.find(
      { userId: user.id, quizId },
      { score: 1, totalMarks: 1, percent: 1, passed: 1, createdAt: 1 },
    )
      .sort({ createdAt: -1, _id: -1 })
      .lean(),
  );

  const best = rows.reduce((m, r) => Math.max(m, Number(r.percent || 0)), 0);
  return ok({ attempts: rows, best });
});
