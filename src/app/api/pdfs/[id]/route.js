import { connectDb, ser, Pdf, Course, Chapter, Subject, Enrollment } from "@/db";
import { handler, ok, fail } from "@/server/http";
import { currentUser } from "@/server/auth";
import { awardXp, touchStreak } from "@/server/gamification";

export const dynamic = "force-dynamic";

export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const pdfId = Number(id);
  if (!Number.isFinite(pdfId)) return fail(400, "Invalid material id");

  await connectDb();
  const pdfDoc = await Pdf.findById(pdfId).lean();
  if (!pdfDoc || !pdfDoc.published) return fail(404, "Study material not found");
  const pdf = ser(pdfDoc);

  const courseDoc = await Course.findById(pdf.courseId).lean();
  const course = courseDoc ? ser(courseDoc) : null;
  const user = await currentUser(request);

  let enrollment = null;
  if (user) {
    const e = await Enrollment.findOne({ userId: user.id, courseId: pdf.courseId }).lean();
    enrollment = e ? ser(e) : null;
  }

  const hasAccess = course?.isFree || pdf.isFree || !!enrollment || user?.role === "ADMIN";
  if (!hasAccess) {
    return fail(403, "Enrol in this course to open this material.", {
      locked: true,
      courseId: pdf.courseId,
    });
  }

  const chapter = pdf.chapterId ? ser(await Chapter.findById(pdf.chapterId).lean()) : null;
  const subject = pdf.subjectId ? ser(await Subject.findById(pdf.subjectId).lean()) : null;

  if (user && user.role === "STUDENT") {
    await touchStreak(user.id);
    await awardXp(user.id, "pdf_read", `pdf-${pdf.id}`);
  }

  return ok({
    pdf: {
      ...pdf,
      // Download availability is enforced here; the client only hides the button.
      downloadUrl: pdf.allowDownload ? pdf.fileUrl : null,
    },
    course: course ? { id: course.id, title: course.title, titleMr: course.titleMr } : null,
    chapter,
    subject,
  });
});
