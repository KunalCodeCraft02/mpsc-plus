import { connectDb, ser, Subject, Chapter, Lecture, Pdf, LectureProgress } from "@/db";
import { HttpError } from "@/server/auth";
import { extractYoutubeId } from "@/lib/utils";
import { logAudit } from "@/server/services/adminEntities";

/**
 * Lectures/PDFs are modeled as Course -> Subject -> Chapter -> Lecture/Pdf so
 * they show up in the student curriculum view, but the simplified course
 * builder doesn't ask the admin to pick a subject/chapter. New items land in
 * the course's first subject/chapter, creating one ("Course Content" ->
 * "Lectures") the first time a course has none. Existing lectures/PDFs keep
 * whatever subject/chapter they already have — this only affects new items.
 */
export async function ensureDefaultChapter(courseId) {
  let subject = await Subject.findOne({ courseId }).sort({ orderIndex: 1, _id: 1 }).lean();
  if (!subject) {
    subject = (await Subject.create({ courseId, name: "Course Content", orderIndex: 1 })).toObject();
  }
  let chapter = await Chapter.findOne({ courseId, subjectId: subject._id })
    .sort({ orderIndex: 1, _id: 1 })
    .lean();
  if (!chapter) {
    chapter = (
      await Chapter.create({ courseId, subjectId: subject._id, title: "Lectures", orderIndex: 1 })
    ).toObject();
  }
  return { subjectId: subject._id, chapterId: chapter._id };
}

export async function getCourseContent(courseId) {
  await connectDb();
  const [lectureRows, pdfRows] = await Promise.all([
    Lecture.find({ courseId }).sort({ orderIndex: 1, _id: 1 }).lean(),
    Pdf.find({ courseId }).sort({ orderIndex: 1, _id: 1 }).lean(),
  ]);
  return {
    lectures: ser(lectureRows).map((l) => ({
      id: l.id,
      title: l.title,
      youtubeUrl: l.youtubeId ? `https://www.youtube.com/watch?v=${l.youtubeId}` : "",
      orderIndex: l.orderIndex,
    })),
    pdfs: ser(pdfRows).map((p) => ({
      id: p.id,
      title: p.title,
      url: p.fileUrl || "",
      orderIndex: p.orderIndex,
    })),
  };
}

/**
 * Diff-and-sync rather than delete-and-reinsert: existing rows (matched by
 * id) are updated in place so LectureProgress and ordering elsewhere stay
 * valid, new rows are inserted, and only rows the admin actually removed from
 * the list are deleted.
 */
export async function syncCourseLectures(courseId, list, admin) {
  await connectDb();
  const existing = await Lecture.find({ courseId }).lean();
  const existingIds = new Set(existing.map((l) => l._id));
  const keepIds = new Set();
  let defaultTarget = null;

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const youtubeId = extractYoutubeId(item.youtubeUrl || "");
    if (!youtubeId) {
      throw new HttpError(422, `Lecture ${i + 1}: enter a valid YouTube video URL.`);
    }

    const id = item.id != null ? Number(item.id) : null;
    if (id && existingIds.has(id)) {
      keepIds.add(id);
      await Lecture.updateOne(
        { _id: id },
        { $set: { title: item.title.trim(), youtubeId, orderIndex: i + 1 } },
      );
    } else {
      if (!defaultTarget) defaultTarget = await ensureDefaultChapter(courseId);
      const doc = await Lecture.create({
        courseId,
        subjectId: defaultTarget.subjectId,
        chapterId: defaultTarget.chapterId,
        title: item.title.trim(),
        youtubeId,
        orderIndex: i + 1,
        isFree: false,
        published: true,
      });
      keepIds.add(doc._id);
    }
  }

  const removedIds = existing.filter((l) => !keepIds.has(l._id)).map((l) => l._id);
  if (removedIds.length) {
    await Lecture.deleteMany({ _id: { $in: removedIds } });
    await LectureProgress.deleteMany({ lectureId: { $in: removedIds } });
  }

  await logAudit(
    admin,
    "UPDATE",
    "lectures",
    courseId,
    `Saved ${list.length} lecture(s) for course #${courseId}`,
  );
}

export async function syncCoursePdfs(courseId, list, admin) {
  await connectDb();
  const existing = await Pdf.find({ courseId }).lean();
  const existingIds = new Set(existing.map((p) => p._id));
  const keepIds = new Set();

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const url = (item.url || "").trim();
    if (!url) throw new HttpError(422, `PDF ${i + 1}: a link is required.`);

    const id = item.id != null ? Number(item.id) : null;
    if (id && existingIds.has(id)) {
      keepIds.add(id);
      await Pdf.updateOne({ _id: id }, { $set: { title: item.title.trim(), fileUrl: url, orderIndex: i + 1 } });
    } else {
      const doc = await Pdf.create({
        courseId,
        title: item.title.trim(),
        fileUrl: url,
        orderIndex: i + 1,
        isFree: false,
        allowDownload: true,
        published: true,
      });
      keepIds.add(doc._id);
    }
  }

  const removedIds = existing.filter((p) => !keepIds.has(p._id)).map((p) => p._id);
  if (removedIds.length) await Pdf.deleteMany({ _id: { $in: removedIds } });

  await logAudit(
    admin,
    "UPDATE",
    "pdfs",
    courseId,
    `Saved ${list.length} pdf(s) for course #${courseId}`,
  );
}

export async function syncCourseContent(courseId, { lectures = [], pdfs = [] }, admin) {
  await syncCourseLectures(courseId, lectures, admin);
  await syncCoursePdfs(courseId, pdfs, admin);
  return getCourseContent(courseId);
}
