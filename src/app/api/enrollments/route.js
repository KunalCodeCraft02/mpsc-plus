import { connectDb, ser, Course, Enrollment } from "@/db";
import { handler, body, ok, fail } from "@/server/http";
import { requireAuth } from "@/server/auth";

export const POST = handler(async (request) => {
  const user = await requireAuth(request);
  const { courseId } = await body(request);
  const id = Number(courseId);
  if (!Number.isFinite(id)) return fail(400, "Invalid course id");

  await connectDb();
  const course = await Course.findById(id).lean();
  if (!course || !course.published) return fail(404, "Course not found");

  // Paid courses require a completed order — payments are out of scope for now,
  // so we only auto-enrol free courses and never trust a client "paid" flag.
  if (!course.isFree) {
    return fail(402, "This is a paid course. Payment checkout is not enabled yet.", {
      price: course.price,
      currency: course.currency,
    });
  }

  const existing = await Enrollment.findOne({ userId: user.id, courseId: id }).lean();
  if (existing) return ok({ enrollment: ser(existing), alreadyEnrolled: true });

  const enrollment = ser(
    (await Enrollment.create({ userId: user.id, courseId: id })).toObject(),
  );

  return ok({ enrollment, alreadyEnrolled: false });
});
