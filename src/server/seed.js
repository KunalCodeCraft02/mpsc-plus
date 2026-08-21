import {
  connectDb,
  ser,
  User,
  Course,
  Subject,
  Chapter,
  Lecture,
  Pdf,
  Quiz,
  Question,
  Enrollment,
  LectureProgress,
  QuizAttempt,
  XpEvent,
  UserBadge,
  Notification,
  AuditLog,
  SearchQuery,
} from "@/db";
import { hashPassword } from "./auth";
import ensureAdmin from "./ensureAdmin";
import { POLICY } from "@/lib/config";
import { slugify } from "@/lib/utils";

let seedPromise = null;

const YT = [
  "dQw4w9WgXcQ", "M7lc1UVf-VE", "3qHkcs3kG44", "ysz5S6PUM-U",
  "aqz-KE-bpKQ", "2Vv-BfVoq4g", "kJQP7kiw5Fk", "9bZkp7q19f0",
  "e-ORhEE9VVg", "JGwWNGJdvx8", "RgKAFK5djSk", "OPf0YbXqDm0",
  "fJ9rUzIMcZQ", "CevxZvSJLk8", "hTWKbfoikeg", "60ItHLz5WEA",
  "YQHsXMglC9A", "09R8_2nJtjg", "SlPhMPnQ58k", "lp-EO5I60KA",
  "nfWlot6h_JM", "PT2_F-1esPk", "uelHwf8o7_U", "L_jWHffIx5E",
];

const COURSE_DEFS = [
  {
    title: "MPSC Rajyaseva Complete Foundation 2026",
    titleMr: "MPSC राज्यसेवा संपूर्ण पायाभूत अभ्यासक्रम २०२६",
    category: "MPSC Rajyaseva",
    instructor: "Prof. Sandeep Kulkarni",
    language: "Marathi",
    isFree: false,
    price: 4999,
    validityDays: 540,
    published: true,
    description:
      "A complete, syllabus-mapped foundation course for MPSC Rajyaseva Prelims and Mains. Structured subject-wise lectures, curated notes and weekly tests with detailed analysis.",
    descriptionMr:
      "MPSC राज्यसेवा पूर्व व मुख्य परीक्षेसाठी अभ्यासक्रमानुसार संपूर्ण पायाभूत कोर्स. विषयनिहाय व्याख्याने, निवडक नोट्स आणि सखोल विश्लेषणासह साप्ताहिक चाचण्या.",
    subjects: [
      { name: "Indian Polity", nameMr: "भारतीय राज्यव्यवस्था", chapters: ["Constitutional Framework", "Union Executive", "Fundamental Rights"] },
      { name: "Modern Indian History", nameMr: "आधुनिक भारताचा इतिहास", chapters: ["Advent of Europeans", "Freedom Struggle 1857-1919"] },
      { name: "Geography of Maharashtra", nameMr: "महाराष्ट्राचा भूगोल", chapters: ["Physiography & Drainage", "Climate and Soils"] },
      { name: "Indian Economy", nameMr: "भारतीय अर्थव्यवस्था", chapters: ["National Income", "Banking & Monetary Policy"] },
    ],
  },
  {
    title: "Combined Group B Prelims Crash Course",
    titleMr: "संयुक्त गट-ब पूर्व परीक्षा क्रॅश कोर्स",
    category: "Combined Group B",
    instructor: "Dr. Meenal Deshpande",
    language: "Marathi",
    isFree: false,
    price: 2499,
    validityDays: 365,
    published: true,
    description:
      "Fast-track revision course covering the full Combined Group B Prelims syllabus with high-yield lectures and sectional tests.",
    descriptionMr:
      "संयुक्त गट-ब पूर्व परीक्षेच्या संपूर्ण अभ्यासक्रमाची जलद उजळणी, महत्त्वाची व्याख्याने आणि विभागनिहाय चाचण्या.",
    subjects: [
      { name: "Marathi Grammar", nameMr: "मराठी व्याकरण", chapters: ["Shabdanchya Jati", "Samas & Alankar"] },
      { name: "Current Affairs", nameMr: "चालू घडामोडी", chapters: ["National Affairs", "Maharashtra Affairs"] },
      { name: "Quantitative Aptitude", nameMr: "अंकगणित", chapters: ["Percentage & Ratio", "Time Speed Distance"] },
    ],
  },
  {
    title: "Indian Polity Masterclass",
    titleMr: "भारतीय राज्यव्यवस्था मास्टरक्लास",
    category: "Optional Subjects",
    instructor: "Adv. Rohan Patil",
    language: "Bilingual",
    isFree: true,
    price: 0,
    validityDays: 0,
    published: true,
    description:
      "Free deep-dive into the Indian Constitution — articles, schedules, amendments and landmark judgements, explained with MPSC-oriented examples.",
    descriptionMr:
      "भारतीय संविधानाचा मोफत सखोल अभ्यास — कलमे, परिशिष्टे, दुरुस्त्या व महत्त्वाचे निर्णय, MPSC दृष्टिकोनातून.",
    subjects: [
      { name: "Constitution Basics", nameMr: "संविधान मूलतत्त्वे", chapters: ["Preamble & Sources", "Citizenship"] },
      { name: "Governance", nameMr: "प्रशासन", chapters: ["Panchayati Raj", "Constitutional Bodies"] },
    ],
  },
  {
    title: "PSI / STI / ASO Mains Booster",
    titleMr: "PSI / STI / ASO मुख्य परीक्षा बूस्टर",
    category: "PSI / STI / ASO",
    instructor: "Prof. Sandeep Kulkarni",
    language: "Marathi",
    isFree: false,
    price: 1999,
    validityDays: 240,
    published: true,
    description:
      "Targeted Mains preparation with paper-wise strategy, previous year analysis and 20 full-length tests.",
    descriptionMr:
      "पेपरनिहाय रणनीती, मागील वर्षांचे विश्लेषण व २० पूर्ण लांबीच्या चाचण्यांसह लक्ष्यित मुख्य परीक्षा तयारी.",
    subjects: [
      { name: "Environment & Ecology", nameMr: "पर्यावरण व परिस्थितिकी", chapters: ["Biodiversity", "Climate Change"] },
      { name: "Science & Technology", nameMr: "विज्ञान व तंत्रज्ञान", chapters: ["Space & Defence", "Health & Biotech"] },
    ],
  },
  {
    title: "Current Affairs 365 — Daily Pulse",
    titleMr: "चालू घडामोडी ३६५ — डेली पल्स",
    category: "Current Affairs",
    instructor: "Ms. Aarti Jadhav",
    language: "Bilingual",
    isFree: true,
    price: 0,
    validityDays: 0,
    published: true,
    description:
      "Daily 12-minute current affairs briefings with monthly compilation PDFs and weekly MCQ tests.",
    descriptionMr:
      "दररोज १२ मिनिटांचे चालू घडामोडी ब्रीफिंग, मासिक संकलन पीडीएफ व साप्ताहिक MCQ चाचण्या.",
    subjects: [
      { name: "Monthly Digest", nameMr: "मासिक संकलन", chapters: ["January Digest", "February Digest"] },
    ],
  },
  {
    title: "Talathi Bharti Complete Course",
    titleMr: "तलाठी भरती संपूर्ण कोर्स",
    category: "Talathi",
    instructor: "Dr. Meenal Deshpande",
    language: "Marathi",
    isFree: false,
    price: 1299,
    validityDays: 180,
    published: false,
    description: "Complete Talathi recruitment preparation — draft course, being prepared for release.",
    descriptionMr: "संपूर्ण तलाठी भरती तयारी — प्रकाशनासाठी तयार होत असलेला मसुदा कोर्स.",
    subjects: [{ name: "Land Revenue Basics", nameMr: "जमीन महसूल मूलतत्त्वे", chapters: ["Revenue Code"] }],
  },
];

const QUESTION_BANK = [
  {
    text: "Which Article of the Indian Constitution deals with the Right to Constitutional Remedies?",
    textMr: "भारतीय संविधानाचे कोणते कलम संवैधानिक उपायांच्या हक्काशी संबंधित आहे?",
    options: ["Article 30", "Article 32", "Article 39", "Article 44"],
    correctIndex: 1,
    explanation:
      "Article 32 empowers citizens to move the Supreme Court directly for enforcement of Fundamental Rights. Dr. Ambedkar called it the 'heart and soul' of the Constitution.",
  },
  {
    text: "The Preamble of the Indian Constitution was amended by which Constitutional Amendment Act?",
    textMr: "भारतीय संविधानाच्या उद्देशिकेत कोणत्या घटनादुरुस्ती कायद्याने बदल करण्यात आला?",
    options: ["24th Amendment", "42nd Amendment", "44th Amendment", "52nd Amendment"],
    correctIndex: 1,
    explanation:
      "The 42nd Amendment Act, 1976 added the words 'Socialist', 'Secular' and 'Integrity' to the Preamble.",
  },
  {
    text: "Which river is known as the lifeline of Maharashtra?",
    textMr: "महाराष्ट्राची जीवनवाहिनी म्हणून कोणती नदी ओळखली जाते?",
    options: ["Krishna", "Tapi", "Godavari", "Bhima"],
    correctIndex: 2,
    explanation:
      "The Godavari is the longest river in Maharashtra and irrigates the largest area of the state.",
  },
  {
    text: "The Quit India Movement was launched in which year?",
    textMr: "भारत छोडो आंदोलन कोणत्या वर्षी सुरू झाले?",
    options: ["1930", "1935", "1942", "1945"],
    correctIndex: 2,
    explanation:
      "The Quit India Movement began on 8 August 1942 following the Bombay session of the AICC.",
  },
  {
    text: "Which body is responsible for conducting the MPSC examinations?",
    textMr: "MPSC परीक्षा घेण्याची जबाबदारी कोणत्या संस्थेवर आहे?",
    options: [
      "Union Public Service Commission",
      "Maharashtra Public Service Commission",
      "Staff Selection Commission",
      "Maharashtra Education Board",
    ],
    correctIndex: 1,
    explanation:
      "The Maharashtra Public Service Commission (MPSC) is a constitutional body under Article 315 conducting state civil services examinations.",
  },
  {
    text: "Repo rate in India is decided by which authority?",
    textMr: "भारतातील रेपो दर कोणत्या यंत्रणेकडून निश्चित केला जातो?",
    options: ["Ministry of Finance", "SEBI", "Monetary Policy Committee of RBI", "NITI Aayog"],
    correctIndex: 2,
    explanation:
      "The six-member Monetary Policy Committee (MPC) of the Reserve Bank of India determines the policy repo rate.",
  },
  {
    text: "'Samas' in Marathi grammar refers to:",
    textMr: "मराठी व्याकरणात 'समास' म्हणजे काय?",
    options: [
      "Joining of letters",
      "Compounding of words",
      "Figure of speech",
      "Change of gender",
    ],
    correctIndex: 1,
    explanation:
      "Samas is the process of combining two or more words into a single compound word by dropping intermediate case-endings.",
  },
  {
    text: "Which of the following is a Constitutional Body?",
    textMr: "खालीलपैकी कोणती संवैधानिक संस्था आहे?",
    options: ["NITI Aayog", "Election Commission of India", "CBI", "NHRC"],
    correctIndex: 1,
    explanation:
      "The Election Commission of India is established under Article 324. NITI Aayog, CBI and NHRC are non-constitutional bodies.",
  },
];

const STUDENT_NAMES = [
  ["Aditya Bhosale", 4820], ["Sneha Patil", 4310], ["Rohit Jadhav", 3980],
  ["Priya Kulkarni", 3620], ["Nikhil More", 3150], ["Shruti Deshmukh", 2870],
  ["Omkar Shinde", 2540], ["Kavita Pawar", 2180], ["Amit Sawant", 1860],
  ["Pooja Gaikwad", 1520], ["Sagar Chavan", 1240], ["Manasi Joshi", 980],
  ["Vaibhav Salunkhe", 720], ["Ritika Mane", 460],
];

/** Insert one document, returning null when a unique index rejects it. */
async function createOne(Model, doc) {
  try {
    return ser((await Model.create(doc)).toObject());
  } catch (err) {
    if (err?.code === 11000) return null;
    throw err;
  }
}

/** Bulk insert, skipping documents that collide with a unique index. */
async function insertIgnoringDupes(Model, docs) {
  if (!docs.length) return;
  try {
    await Model.insertMany(docs, { ordered: false });
  } catch (err) {
    if (err?.code !== 11000 && !err?.writeErrors) throw err;
  }
}

async function isSeeded() {
  await connectDb();
  return (await Course.countDocuments()) > 0;
}

async function runSeed() {
  await connectDb();
  if (await isSeeded()) return { seeded: false, reason: "already-seeded" };

  const now = new Date();
  const studentHash = await hashPassword("Student@123");

  // The administrator is provisioned by ensureAdmin() from environment config,
  // never seeded with demo credentials.
  const { id: adminId } = await ensureAdmin();
  const admin = ser(await User.findById(adminId).lean());

  const demo = await createOne(User, {
    name: "Aarav Patil",
    email: "student@mpscpulse.in",
    mobile: "9800000002",
    passwordHash: studentHash,
    role: "STUDENT",
    language: "mr",
    xp: 2340,
    streakCurrent: 7,
    streakLongest: 12,
    lastStudyDate: new Date().toISOString().slice(0, 10),
    termsVersion: POLICY.termsVersion,
    privacyVersion: POLICY.privacyVersion,
    acceptedAt: now,
  });

  await insertIgnoringDupes(
    User,
    STUDENT_NAMES.map(([name, xp], i) => ({
      name,
      email: `${slugify(name).replace(/-/g, ".")}@example.com`,
      mobile: `98111${String(10000 + i).slice(-5)}`,
      passwordHash: studentHash,
      role: "STUDENT",
      language: i % 3 === 0 ? "en" : "mr",
      xp,
      streakCurrent: (i * 3) % 14,
      streakLongest: ((i * 5) % 21) + 2,
      status: i === 13 ? "INACTIVE" : "ACTIVE",
      termsVersion: POLICY.termsVersion,
      privacyVersion: POLICY.privacyVersion,
      acceptedAt: now,
      createdAt: new Date(now.getTime() - (i + 1) * 3 * 86400000),
    })),
  );

  let ytIdx = 0;
  const createdCourses = [];

  for (const def of COURSE_DEFS) {
    const course = ser(
      (
        await Course.create({
          title: def.title,
          titleMr: def.titleMr,
          slug: slugify(def.title),
          description: def.description,
          descriptionMr: def.descriptionMr,
          instructor: def.instructor,
          category: def.category,
          language: def.language,
          isFree: def.isFree,
          price: def.price,
          currency: "INR",
          validityDays: def.validityDays,
          published: def.published,
        })
      ).toObject(),
    );
    createdCourses.push(course);

    let sIdx = 1;
    for (const sub of def.subjects) {
      const subject = ser(
        (
          await Subject.create({
            courseId: course.id,
            name: sub.name,
            nameMr: sub.nameMr,
            description: `${sub.name} — syllabus mapped module for ${def.category}.`,
            orderIndex: sIdx++,
          })
        ).toObject(),
      );

      let cIdx = 1;
      for (const chTitle of sub.chapters) {
        const chapter = ser(
          (
            await Chapter.create({
              courseId: course.id,
              subjectId: subject.id,
              title: chTitle,
              description: `Detailed coverage of ${chTitle}.`,
              orderIndex: cIdx++,
            })
          ).toObject(),
        );

        const lectureCount = 2;
        for (let l = 1; l <= lectureCount; l += 1) {
          const yid = YT[ytIdx % YT.length];
          ytIdx += 1;
          await Lecture.create({
            courseId: course.id,
            subjectId: subject.id,
            chapterId: chapter.id,
            title: `${chTitle} — Part ${l}`,
            titleMr: `${chTitle} — भाग ${l}`,
            description: `Session ${l} on ${chTitle}, with previous-year question mapping and revision pointers.`,
            youtubeId: yid,
            durationMin: 28 + ((ytIdx * 7) % 40),
            orderIndex: l,
            isFree: def.isFree ? l === 1 && cIdx === 2 : true,
            published: def.published,
          });
        }

        await Pdf.create({
          courseId: course.id,
          subjectId: subject.id,
          chapterId: chapter.id,
          title: `${chTitle} — Notes`,
          titleMr: `${chTitle} — नोट्स`,
          description: `Concise revision notes for ${chTitle} with diagrams and one-liners.`,
          fileUrl: `https://storage.mpscpulse.in/notes/${slugify(chTitle)}.pdf`,
          storageKey: `notes/${slugify(chTitle)}.pdf`,
          fileSizeKb: 640 + ((cIdx * 137) % 2400),
          pageCount: 12 + ((cIdx * 7) % 40),
          isFree: !def.isFree || cIdx === 2,
          allowDownload: !def.isFree,
          published: def.published,
        });
      }
    }
  }

  /* Quizzes */
  const quizDefs = [
    { courseIdx: 0, title: "Indian Polity — Sectional Test 1", titleMr: "भारतीय राज्यव्यवस्था — विभागीय चाचणी १", difficulty: "medium", time: 20, free: true },
    { courseIdx: 0, title: "Modern History Full Test", titleMr: "आधुनिक इतिहास पूर्ण चाचणी", difficulty: "hard", time: 45, free: false },
    { courseIdx: 2, title: "Constitution Basics Quiz", titleMr: "संविधान मूलतत्त्वे प्रश्नमंजुषा", difficulty: "easy", time: 10, free: true },
    { courseIdx: 1, title: "Marathi Grammar Rapid Round", titleMr: "मराठी व्याकरण झटपट चाचणी", difficulty: "medium", time: 15, free: true },
    { courseIdx: 4, title: "Current Affairs Weekly — Week 6", titleMr: "चालू घडामोडी साप्ताहिक — आठवडा ६", difficulty: "medium", time: 12, free: true },
  ];

  const createdQuizzes = [];
  for (const qd of quizDefs) {
    const course = createdCourses[qd.courseIdx];
    const subjectRow = await Subject.findOne({ courseId: course.id }).lean();
    const quiz = ser(
      (
        await Quiz.create({
          courseId: course.id,
          subjectId: subjectRow?._id ?? null,
          title: qd.title,
          titleMr: qd.titleMr,
          description:
            "Backend-evaluated test with detailed per-question analysis and explanations.",
          difficulty: qd.difficulty,
          timeLimitMin: qd.time,
          passingPercent: 40,
          isFree: qd.free,
          published: true,
        })
      ).toObject(),
    );
    createdQuizzes.push(quiz);

    const pick = QUESTION_BANK.slice(0, 5 + (qd.courseIdx % 3));
    await Question.insertMany(
      pick.map((q, i) => ({
        quizId: quiz.id,
        orderIndex: i + 1,
        text: q.text,
        textMr: q.textMr,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        marks: 2,
        negativeMarks: qd.difficulty === "hard" ? 1 : 0,
      })),
    );
  }

  /* Demo learner activity */
  if (demo) {
    const enrollCourses = [createdCourses[0], createdCourses[2], createdCourses[4]];
    for (const c of enrollCourses) {
      await createOne(Enrollment, {
        userId: demo.id,
        courseId: c.id,
        progressPercent: 0,
      });
    }

    const firstLectures = await Lecture.find({ courseId: createdCourses[0].id })
      .limit(6)
      .lean();

    for (let i = 0; i < firstLectures.length; i += 1) {
      const done = i < 4;
      await createOne(LectureProgress, {
        userId: demo.id,
        courseId: createdCourses[0].id,
        lectureId: firstLectures[i]._id,
        positionSec: done ? (firstLectures[i].durationMin || 30) * 60 : 420,
        percent: done ? 100 : 35,
        completed: done,
        completedAt: done ? new Date(now.getTime() - (6 - i) * 86400000) : null,
      });
      if (done) {
        await createOne(XpEvent, {
          userId: demo.id,
          kind: "lecture_complete",
          refId: String(firstLectures[i]._id),
          amount: 10,
          createdAt: new Date(now.getTime() - (6 - i) * 86400000),
        });
      }
    }

    await Enrollment.updateOne(
      { userId: demo.id, courseId: createdCourses[0].id },
      { $set: { progressPercent: 42 } },
    );

    if (createdQuizzes[0]) {
      await QuizAttempt.create({
        userId: demo.id,
        quizId: createdQuizzes[0].id,
        courseId: createdQuizzes[0].courseId,
        score: 8,
        totalMarks: 10,
        percent: 80,
        correct: 4,
        incorrect: 1,
        unanswered: 0,
        timeTakenSec: 610,
        passed: true,
        answers: {},
        createdAt: new Date(now.getTime() - 2 * 86400000),
      });
      await createOne(XpEvent, {
        userId: demo.id,
        kind: "quiz_attempt",
        refId: String(createdQuizzes[0].id),
        amount: 5,
        createdAt: new Date(now.getTime() - 2 * 86400000),
      });
    }

    await insertIgnoringDupes(
      UserBadge,
      ["first_lecture", "streak_7", "bookworm"].map((code) => ({
        userId: demo.id,
        code,
      })),
    );
  }

  /* Platform data */
  await Notification.insertMany([
    {
      title: "New lecture added: Union Executive — Part 1",
      titleMr: "नवीन व्याख्यान: केंद्रीय कार्यकारी मंडळ — भाग १",
      body: "A new lecture is now live in MPSC Rajyaseva Complete Foundation 2026.",
      bodyMr: "MPSC राज्यसेवा संपूर्ण पायाभूत अभ्यासक्रम २०२६ मध्ये नवीन व्याख्यान उपलब्ध.",
      kind: "lecture",
      audience: "ALL",
    },
    {
      title: "Weekly test is live",
      titleMr: "साप्ताहिक चाचणी सुरू",
      body: "Current Affairs Weekly — Week 6 is now open. Attempt before Sunday midnight.",
      bodyMr: "चालू घडामोडी साप्ताहिक — आठवडा ६ आता खुली. रविवार मध्यरात्रीपूर्वी सोडवा.",
      kind: "quiz",
      audience: "ALL",
    },
    {
      title: "Polity Masterclass is now free for everyone",
      titleMr: "राज्यव्यवस्था मास्टरक्लास आता सर्वांसाठी मोफत",
      body: "Indian Polity Masterclass has been switched to free access.",
      bodyMr: "भारतीय राज्यव्यवस्था मास्टरक्लास मोफत प्रवेशासाठी उपलब्ध.",
      kind: "announcement",
      audience: "ALL",
    },
    {
      title: "February digest PDF uploaded",
      titleMr: "फेब्रुवारी संकलन पीडीएफ अपलोड",
      body: "Monthly current affairs compilation is available in Study Material.",
      bodyMr: "मासिक चालू घडामोडी संकलन अभ्यास साहित्यात उपलब्ध.",
      kind: "update",
      audience: "ALL",
    },
  ]);

  if (admin) {
    await AuditLog.insertMany([
      { adminId: admin.id, adminName: admin.name, action: "CREATE", entity: "courses", entityId: "1", detail: "Created course MPSC Rajyaseva Complete Foundation 2026" },
      { adminId: admin.id, adminName: admin.name, action: "PUBLISH", entity: "courses", entityId: "1", detail: "Published course" },
      { adminId: admin.id, adminName: admin.name, action: "CREATE", entity: "lectures", entityId: "3", detail: "Added YouTube lecture Union Executive — Part 1" },
      { adminId: admin.id, adminName: admin.name, action: "CREATE", entity: "quizzes", entityId: "1", detail: "Created Indian Polity — Sectional Test 1" },
      { adminId: admin.id, adminName: admin.name, action: "PRICE", entity: "courses", entityId: "3", detail: "Changed Indian Polity Masterclass from PAID to FREE" },
    ]);
  }

  await insertIgnoringDupes(
    SearchQuery,
    [
      ["polity", 412], ["current affairs", 388], ["indian constitution", 301],
      ["राज्यव्यवस्था", 264], ["marathi grammar", 233], ["economy notes", 198],
      ["rajyaseva", 187], ["mock test", 165],
    ].map(([q, hits]) => ({ q, hits })),
  );

  return { seeded: true, courses: createdCourses.length, quizzes: createdQuizzes.length };
}

/** Idempotent, single-flight demo seed. */
export function ensureSeeded() {
  if (process.env.SEED_DEMO_DATA !== "true") {
    return Promise.resolve({ seeded: false, reason: "demo-seeding-disabled" });
  }
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

export default runSeed;
