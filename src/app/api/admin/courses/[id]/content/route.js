import { handler, ok, body } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { HttpError } from "@/server/auth";
import { courseContentSchema } from "@/server/validation";
import { getCourseContent, syncCourseContent } from "@/server/services/courseContent";
import { connectDb, Course } from "@/db";

export const dynamic = "force-dynamic";

async function requireCourse(id) {
  await connectDb();
  const courseId = Number(id);
  if (!Number.isFinite(courseId)) throw new HttpError(400, "Invalid course id");
  const exists = await Course.exists({ _id: courseId });
  if (!exists) throw new HttpError(404, "Course not found");
  return courseId;
}

export const GET = handler(async (request, ctx) => {
  await requireAdmin(request);
  const { id } = await ctx.params;
  const courseId = await requireCourse(id);
  return ok(await getCourseContent(courseId));
});

export const PUT = handler(async (request, ctx) => {
  const admin = await requireAdmin(request);
  const { id } = await ctx.params;
  const courseId = await requireCourse(id);
  const data = courseContentSchema.parse(await body(request));
  return ok(await syncCourseContent(courseId, data, admin));
});
