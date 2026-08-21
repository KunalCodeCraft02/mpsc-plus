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
  User,
  Notification,
  AuditLog,
  Enrollment,
  LectureProgress,
  QuizAttempt,
} from "@/db";
import { HttpError } from "@/server/auth";
import { SCHEMAS, notificationSchema } from "@/server/validation";
import { extractYoutubeId, slugify } from "@/lib/utils";

export const ENTITIES = {
  courses: {
    model: Course,
    searchCols: ["title", "titleMr", "instructor", "category"],
    sortable: { createdAt: "createdAt", title: "title", price: "price" },
    defaultSort: { createdAt: -1, _id: -1 },
    schema: SCHEMAS.courses,
  },
  subjects: {
    model: Subject,
    searchCols: ["name", "nameMr"],
    sortable: { order: "orderIndex", title: "name" },
    defaultSort: { orderIndex: 1, _id: 1 },
    schema: SCHEMAS.subjects,
  },
  chapters: {
    model: Chapter,
    searchCols: ["title", "titleMr"],
    sortable: { order: "orderIndex", title: "title" },
    defaultSort: { orderIndex: 1, _id: 1 },
    schema: SCHEMAS.chapters,
  },
  lectures: {
    model: Lecture,
    searchCols: ["title", "titleMr", "description"],
    sortable: { createdAt: "createdAt", order: "orderIndex", title: "title" },
    defaultSort: { createdAt: -1, _id: -1 },
    schema: SCHEMAS.lectures,
  },
  pdfs: {
    model: Pdf,
    searchCols: ["title", "titleMr", "description"],
    sortable: { createdAt: "createdAt", title: "title" },
    defaultSort: { createdAt: -1, _id: -1 },
    schema: SCHEMAS.pdfs,
  },
  quizzes: {
    model: Quiz,
    searchCols: ["title", "titleMr", "description"],
    sortable: { createdAt: "createdAt", title: "title" },
    defaultSort: { createdAt: -1, _id: -1 },
    schema: SCHEMAS.quizzes,
  },
  students: {
    model: User,
    searchCols: ["name", "email", "mobile"],
    sortable: { createdAt: "createdAt", name: "name", xp: "xp" },
    defaultSort: { createdAt: -1, _id: -1 },
    readOnly: true,
  },
  notifications: {
    model: Notification,
    searchCols: ["title", "titleMr", "body"],
    sortable: { createdAt: "createdAt" },
    defaultSort: { createdAt: -1, _id: -1 },
    schema: notificationSchema,
  },
};

export function entityConf(entity) {
  const conf = ENTITIES[entity];
  if (!conf) throw new HttpError(404, `Unknown resource: ${entity}`);
  return conf;
}

export async function logAudit(admin, action, entity, entityId, detail) {
  try {
    await connectDb();
    await AuditLog.create({
      adminId: admin?.id ?? null,
      adminName: admin?.name ?? "system",
      action,
      entity,
      entityId: String(entityId ?? ""),
      detail: detail ? String(detail).slice(0, 500) : null,
    });
  } catch {
    /* audit failures must never break the operation */
  }
}

function emptyToNull(value) {
  return value === "" || value === undefined ? null : value;
}

/** Escape user input before using it inside a regular expression. */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalise validated payloads into database documents. */
export function toRow(entity, data) {
  if (entity === "courses") {
    return {
      title: data.title,
      titleMr: emptyToNull(data.titleMr),
      slug: `${slugify(data.title)}-${Math.random().toString(36).slice(2, 6)}`,
      description: emptyToNull(data.description),
      descriptionMr: emptyToNull(data.descriptionMr),
      thumbnailUrl: emptyToNull(data.thumbnailUrl),
      instructor: emptyToNull(data.instructor),
      category: emptyToNull(data.category),
      language: data.language || "Marathi",
      isFree: !!data.isFree,
      price: data.isFree ? 0 : Math.round(data.price || 0),
      currency: data.currency || "INR",
      validityDays: data.isFree ? 0 : Math.round(data.validityDays || 0),
      published: !!data.published,
    };
  }
  if (entity === "subjects") {
    return {
      courseId: data.courseId,
      name: data.name,
      nameMr: emptyToNull(data.nameMr),
      description: emptyToNull(data.description),
      orderIndex: data.orderIndex || 1,
    };
  }
  if (entity === "chapters") {
    return {
      courseId: data.courseId,
      subjectId: data.subjectId,
      title: data.title,
      titleMr: emptyToNull(data.titleMr),
      description: emptyToNull(data.description),
      orderIndex: data.orderIndex || 1,
    };
  }
  if (entity === "lectures") {
    const youtubeId = extractYoutubeId(data.youtubeId || data.youtubeUrl || "");
    if (!youtubeId) {
      throw new HttpError(422, "Enter a valid YouTube URL or 11-character video ID.");
    }
    return {
      courseId: data.courseId,
      subjectId: data.subjectId || null,
      chapterId: data.chapterId || null,
      title: data.title,
      titleMr: emptyToNull(data.titleMr),
      description: emptyToNull(data.description),
      youtubeId,
      durationMin: Math.round(data.durationMin || 0),
      thumbnailUrl: emptyToNull(data.thumbnailUrl),
      orderIndex: data.orderIndex || 1,
      isFree: !!data.isFree,
      published: !!data.published,
    };
  }
  if (entity === "pdfs") {
    return {
      courseId: data.courseId,
      subjectId: data.subjectId || null,
      chapterId: data.chapterId || null,
      title: data.title,
      titleMr: emptyToNull(data.titleMr),
      description: emptyToNull(data.description),
      fileUrl: data.fileUrl,
      storageKey: null,
      fileSizeKb: Math.round(data.fileSizeKb || 0),
      pageCount: Math.round(data.pageCount || 0),
      orderIndex: data.orderIndex || 1,
      isFree: !!data.isFree,
      allowDownload: !!data.allowDownload,
      published: !!data.published,
    };
  }
  if (entity === "quizzes") {
    return {
      courseId: data.courseId,
      subjectId: data.subjectId || null,
      chapterId: data.chapterId || null,
      title: data.title,
      titleMr: emptyToNull(data.titleMr),
      description: emptyToNull(data.description),
      difficulty: data.difficulty,
      timeLimitMin: Math.round(data.timeLimitMin),
      passingPercent: Math.round(data.passingPercent),
      isFree: !!data.isFree,
      published: !!data.published,
    };
  }
  if (entity === "notifications") {
    return {
      title: data.title,
      titleMr: emptyToNull(data.titleMr),
      body: emptyToNull(data.body),
      bodyMr: emptyToNull(data.bodyMr),
      kind: data.kind,
      audience: data.audience,
      courseId: data.audience === "COURSE" ? data.courseId || null : null,
    };
  }
  throw new HttpError(400, "Unsupported resource");
}

/**
 * The SQL version computed these with correlated sub-selects. Here each one is a
 * single grouped aggregate over the page's ids, which keeps it to one round trip
 * per related collection instead of one per row.
 */
const extraCounts = {
  courses: [
    { key: "lectureCount", model: () => Lecture, fk: "courseId" },
    { key: "pdfCount", model: () => Pdf, fk: "courseId" },
    { key: "quizCount", model: () => Quiz, fk: "courseId" },
    { key: "subjectCount", model: () => Subject, fk: "courseId" },
    { key: "studentCount", model: () => Enrollment, fk: "courseId" },
  ],
  quizzes: [
    { key: "questionCount", model: () => Question, fk: "quizId" },
    { key: "attemptCount", model: () => QuizAttempt, fk: "quizId" },
  ],
  subjects: [
    { key: "chapterCount", model: () => Chapter, fk: "subjectId" },
    { key: "lectureCount", model: () => Lecture, fk: "subjectId" },
  ],
  chapters: [
    { key: "lectureCount", model: () => Lecture, fk: "chapterId" },
    { key: "pdfCount", model: () => Pdf, fk: "chapterId" },
  ],
  students: [
    { key: "coursesEnrolled", model: () => Enrollment, fk: "userId" },
    {
      key: "lecturesCompleted",
      model: () => LectureProgress,
      fk: "userId",
      match: { completed: true },
    },
    { key: "quizzesAttempted", model: () => QuizAttempt, fk: "userId" },
    { key: "avgScore", model: () => QuizAttempt, fk: "userId", avg: "percent" },
  ],
};

async function attachCounts(entity, items) {
  const specs = extraCounts[entity];
  if (!specs || !items.length) return;
  const ids = items.map((i) => i.id);

  await Promise.all(
    specs.map(async (spec) => {
      const rows = await spec.model().aggregate([
        { $match: { [spec.fk]: { $in: ids }, ...(spec.match || {}) } },
        {
          $group: {
            _id: `$${spec.fk}`,
            n: spec.avg ? { $avg: `$${spec.avg}` } : { $sum: 1 },
          },
        },
      ]);
      const map = new Map(rows.map((r) => [r._id, r.n]));
      for (const item of items) {
        const v = map.get(item.id) ?? 0;
        item[spec.key] = spec.avg ? Math.round(v) : v;
      }
    }),
  );
}

export async function listEntity(entity, params) {
  await connectDb();
  const conf = entityConf(entity);
  const model = conf.model;
  const paths = model.schema.paths;
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(params.perPage) || 10));

  const filter = {};
  const and = [];

  if (entity === "students") filter.role = { $in: ["STUDENT", "TEACHER"] };

  if (params.q) {
    const rx = new RegExp(escapeRegex(params.q), "i");
    and.push({ $or: conf.searchCols.map((c) => ({ [c]: rx })) });
  }
  if (params.courseId && paths.courseId) filter.courseId = Number(params.courseId);
  if (params.subjectId && paths.subjectId) filter.subjectId = Number(params.subjectId);
  if (params.chapterId && paths.chapterId) filter.chapterId = Number(params.chapterId);
  if (params.status === "published" && paths.published) filter.published = true;
  if (params.status === "draft" && paths.published) filter.published = false;
  if (params.access === "free" && paths.isFree) filter.isFree = true;
  if (params.access === "paid" && paths.isFree) filter.isFree = false;
  if (params.language && params.language !== "all" && paths.language) {
    filter.language = params.language;
  }
  if (entity === "students" && params.state === "active") filter.status = "ACTIVE";
  if (entity === "students" && params.state === "inactive") filter.status = "INACTIVE";

  const where = and.length ? { ...filter, $and: and } : filter;

  const sortField = conf.sortable?.[params.sort];
  const sort = sortField
    ? { [sortField]: params.dir === "asc" ? 1 : -1, _id: params.dir === "asc" ? 1 : -1 }
    : conf.defaultSort;

  const projection = entity === "students" ? { passwordHash: 0 } : {};

  const [rows, total] = await Promise.all([
    model
      .find(where, projection)
      .sort(sort)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    model.countDocuments(where),
  ]);

  const items = ser(rows);
  await attachCounts(entity, items);

  // Attach human-readable parent labels for content tables.
  if (["subjects", "chapters", "lectures", "pdfs", "quizzes"].includes(entity)) {
    const courseIds = [...new Set(items.map((i) => i.courseId).filter(Boolean))];
    const subjectIds = [...new Set(items.map((i) => i.subjectId).filter(Boolean))];
    const chapterIds = [...new Set(items.map((i) => i.chapterId).filter(Boolean))];
    const [cRows, sRows, chRows] = await Promise.all([
      courseIds.length
        ? Course.find({ _id: { $in: courseIds } }, { title: 1 }).lean()
        : [],
      subjectIds.length
        ? Subject.find({ _id: { $in: subjectIds } }, { name: 1 }).lean()
        : [],
      chapterIds.length
        ? Chapter.find({ _id: { $in: chapterIds } }, { title: 1 }).lean()
        : [],
    ]);
    const cMap = Object.fromEntries(cRows.map((r) => [r._id, r.title]));
    const sMap = Object.fromEntries(sRows.map((r) => [r._id, r.name]));
    const chMap = Object.fromEntries(chRows.map((r) => [r._id, r.title]));
    for (const i of items) {
      i.courseTitle = cMap[i.courseId] || null;
      i.subjectName = sMap[i.subjectId] || null;
      i.chapterTitle = chMap[i.chapterId] || null;
    }
  }

  return {
    items,
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getEntity(entity, id) {
  await connectDb();
  const conf = entityConf(entity);
  const projection = entity === "students" ? { passwordHash: 0 } : {};
  const found = await conf.model.findById(Number(id), projection).lean();
  if (!found) throw new HttpError(404, "Not found");
  const row = ser(found);

  if (entity === "quizzes") {
    row.questions = ser(
      await Question.find({ quizId: row.id }).sort({ orderIndex: 1, _id: 1 }).lean(),
    );
  }
  if (entity === "students") {
    const enrolls = await Enrollment.find({ userId: row.id }).lean();
    const courseTitles = Object.fromEntries(
      (
        await Course.find(
          { _id: { $in: enrolls.map((e) => e.courseId) } },
          { title: 1 },
        ).lean()
      ).map((c) => [c._id, c.title]),
    );
    // innerJoin semantics: only rows whose course still exists.
    row.enrollments = enrolls
      .filter((e) => courseTitles[e.courseId] !== undefined)
      .map((e) => ({
        courseId: e.courseId,
        progressPercent: e.progressPercent,
        title: courseTitles[e.courseId],
      }));

    const attempts = await QuizAttempt.find({ userId: row.id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(10)
      .lean();
    const quizTitles = Object.fromEntries(
      (
        await Quiz.find({ _id: { $in: attempts.map((a) => a.quizId) } }, { title: 1 }).lean()
      ).map((q) => [q._id, q.title]),
    );
    row.attempts = attempts
      .filter((a) => quizTitles[a.quizId] !== undefined)
      .map((a) => ({
        id: a._id,
        percent: a.percent,
        passed: a.passed,
        createdAt: a.createdAt,
        title: quizTitles[a.quizId],
      }));
  }
  return row;
}

async function syncQuestions(quizId, list = []) {
  await Question.deleteMany({ quizId });
  if (!list.length) return;
  await Question.insertMany(
    list.map((q, i) => ({
      quizId,
      orderIndex: i + 1,
      text: q.text,
      textMr: q.textMr || null,
      options: q.options,
      correctIndex: Number(q.correctIndex) || 0,
      explanation: q.explanation || null,
      marks: Math.round(Number(q.marks) || 1),
      negativeMarks: Math.round(Number(q.negativeMarks) || 0),
    })),
  );
}

export async function createEntity(entity, payload, admin) {
  await connectDb();
  const conf = entityConf(entity);
  if (conf.readOnly) throw new HttpError(405, "This resource cannot be created here");
  const data = conf.schema.parse(payload);
  const row = toRow(entity, data);
  const doc = await conf.model.create(row);
  const created = ser(doc.toObject());
  if (entity === "quizzes") await syncQuestions(created.id, data.questions);
  await logAudit(
    admin,
    "CREATE",
    entity,
    created.id,
    `Created ${entity.slice(0, -1)} "${created.title || created.name}"`,
  );
  return created;
}

export async function updateEntity(entity, id, payload, admin) {
  await connectDb();
  const conf = entityConf(entity);
  const numericId = Number(id);

  // Lightweight toggles (publish / free-paid / status / reorder)
  if (payload.__action) {
    const action = payload.__action;
    if (entity === "students") {
      if (!["deactivate", "reactivate"].includes(action)) {
        throw new HttpError(400, "Unsupported action");
      }
      const status = action === "deactivate" ? "INACTIVE" : "ACTIVE";
      const updated = await User.findByIdAndUpdate(
        numericId,
        { $set: { status } },
        { returnDocument: "after", projection: { passwordHash: 0 } },
      ).lean();
      await logAudit(
        admin,
        action.toUpperCase(),
        entity,
        numericId,
        `${status} student ${updated?.name}`,
      );
      return ser(updated);
    }
    const patch = {};
    if (action === "publish") patch.published = true;
    else if (action === "unpublish") patch.published = false;
    else if (action === "makeFree")
      Object.assign(patch, { isFree: true, ...(entity === "courses" ? { price: 0 } : {}) });
    else if (action === "makePaid") patch.isFree = false;
    else if (action === "reorder")
      patch.orderIndex = Math.max(1, Number(payload.orderIndex) || 1);
    else throw new HttpError(400, "Unsupported action");

    const updated = await conf.model
      .findByIdAndUpdate(numericId, { $set: patch }, { returnDocument: "after" })
      .lean();
    if (!updated) throw new HttpError(404, "Not found");
    const row = ser(updated);
    await logAudit(
      admin,
      action.toUpperCase(),
      entity,
      numericId,
      `${action} on "${row.title || row.name}"`,
    );
    return row;
  }

  if (conf.readOnly) throw new HttpError(405, "This resource is read-only");

  const data = conf.schema.parse(payload);
  const patch = toRow(entity, data);
  if (entity === "courses") delete patch.slug; // keep the original slug stable
  const updated = await conf.model
    .findByIdAndUpdate(numericId, { $set: patch }, { returnDocument: "after", runValidators: true })
    .lean();
  if (!updated) throw new HttpError(404, "Not found");
  const row = ser(updated);
  if (entity === "quizzes") await syncQuestions(numericId, data.questions);
  await logAudit(admin, "UPDATE", entity, numericId, `Updated "${row.title || row.name}"`);
  return row;
}

export async function deleteEntity(entity, id, admin) {
  await connectDb();
  const conf = entityConf(entity);
  if (conf.readOnly) throw new HttpError(405, "This resource cannot be deleted here");
  const numericId = Number(id);

  if (entity === "courses") {
    await Lecture.deleteMany({ courseId: numericId });
    await Pdf.deleteMany({ courseId: numericId });
    const qs = await Quiz.find({ courseId: numericId }, { _id: 1 }).lean();
    if (qs.length) await Question.deleteMany({ quizId: { $in: qs.map((q) => q._id) } });
    await Quiz.deleteMany({ courseId: numericId });
    await Chapter.deleteMany({ courseId: numericId });
    await Subject.deleteMany({ courseId: numericId });
    await Enrollment.deleteMany({ courseId: numericId });
  }
  if (entity === "subjects") {
    await Lecture.deleteMany({ subjectId: numericId });
    await Pdf.deleteMany({ subjectId: numericId });
    await Chapter.deleteMany({ subjectId: numericId });
  }
  if (entity === "chapters") {
    await Lecture.deleteMany({ chapterId: numericId });
    await Pdf.deleteMany({ chapterId: numericId });
  }
  if (entity === "quizzes") {
    await Question.deleteMany({ quizId: numericId });
    await QuizAttempt.deleteMany({ quizId: numericId });
  }
  if (entity === "lectures") {
    await LectureProgress.deleteMany({ lectureId: numericId });
  }

  const removed = await conf.model.findByIdAndDelete(numericId).lean();
  if (!removed) throw new HttpError(404, "Not found");
  const row = ser(removed);
  await logAudit(admin, "DELETE", entity, numericId, `Deleted "${row.title || row.name}"`);
  return row;
}

export async function duplicateEntity(entity, id, admin) {
  await connectDb();
  const conf = entityConf(entity);
  if (!["courses", "quizzes"].includes(entity)) {
    throw new HttpError(400, "Duplication not supported");
  }
  const found = await conf.model.findById(Number(id)).lean();
  if (!found) throw new HttpError(404, "Not found");
  const row = ser(found);

  const { id: _omit, createdAt: _omitAt, ...rest } = row;
  const copy = {
    ...rest,
    title: `${row.title} (Copy)`,
    published: false,
    ...(entity === "courses"
      ? { slug: `${slugify(row.title)}-copy-${Math.random().toString(36).slice(2, 6)}` }
      : {}),
  };
  const created = ser((await conf.model.create(copy)).toObject());

  if (entity === "quizzes") {
    const qs = await Question.find({ quizId: row.id }).lean();
    if (qs.length) {
      await Question.insertMany(
        qs.map(({ _id: _qid, ...q }) => ({ ...q, quizId: created.id })),
      );
    }
  }
  if (entity === "courses") {
    const subs = await Subject.find({ courseId: row.id }).lean();
    for (const s of subs) {
      const { _id: sid, ...sRest } = s;
      const newSub = await Subject.create({ ...sRest, courseId: created.id });
      const chs = await Chapter.find({ subjectId: sid }).lean();
      for (const c of chs) {
        const { _id: cid, ...cRest } = c;
        const newCh = await Chapter.create({
          ...cRest,
          courseId: created.id,
          subjectId: newSub._id,
        });
        const lecs = await Lecture.find({ chapterId: cid }).lean();
        if (lecs.length) {
          await Lecture.insertMany(
            lecs.map(({ _id: _lid, ...l }) => ({
              ...l,
              courseId: created.id,
              subjectId: newSub._id,
              chapterId: newCh._id,
              published: false,
            })),
          );
        }
        const docs = await Pdf.find({ chapterId: cid }).lean();
        if (docs.length) {
          await Pdf.insertMany(
            docs.map(({ _id: _pid, ...p }) => ({
              ...p,
              courseId: created.id,
              subjectId: newSub._id,
              chapterId: newCh._id,
              published: false,
            })),
          );
        }
      }
    }
  }

  await logAudit(admin, "DUPLICATE", entity, created.id, `Duplicated from #${id}`);
  return created;
}

export async function bulkEntity(entity, action, ids, admin) {
  await connectDb();
  const conf = entityConf(entity);
  const list = (ids || []).map(Number).filter(Number.isFinite);
  if (!list.length) throw new HttpError(400, "No items selected");

  if (action === "delete") {
    for (const id of list) await deleteEntity(entity, id, admin);
    return { affected: list.length };
  }
  if (!["publish", "unpublish", "makeFree", "makePaid"].includes(action)) {
    throw new HttpError(400, "Unsupported bulk action");
  }
  const patch =
    action === "publish"
      ? { published: true }
      : action === "unpublish"
        ? { published: false }
        : action === "makeFree"
          ? { isFree: true }
          : { isFree: false };

  await conf.model.updateMany({ _id: { $in: list } }, { $set: patch });
  await logAudit(
    admin,
    `BULK_${action.toUpperCase()}`,
    entity,
    list.join(","),
    `${list.length} items`,
  );
  return { affected: list.length };
}
