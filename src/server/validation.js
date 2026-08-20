import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const registerSchema = z
  .object({
    name: z.string().trim().min(3, "Enter your full name").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    mobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    password,
    confirmPassword: z.string(),
    language: z.enum(["en", "mr"]).default("en"),
    acceptedTerms: z.literal(true, {
      message: "You must accept the Terms & Privacy Policy",
    }),
    termsVersion: z.string().optional(),
    privacyVersion: z.string().optional(),
    platform: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or mobile number"),
  password: z.string().min(1, "Enter your password"),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const acceptPolicySchema = z.object({
  termsVersion: z.string().min(1),
  privacyVersion: z.string().min(1),
  language: z.enum(["en", "mr"]).optional(),
  platform: z.string().optional(),
});

export const courseSchema = z.object({
  title: z.string().trim().min(3, "Course title is required").max(200),
  titleMr: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  descriptionMr: z.string().trim().max(4000).optional().or(z.literal("")),
  thumbnailUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  instructor: z.string().trim().max(160).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  language: z.string().trim().max(20).optional().or(z.literal("")),
  isFree: z.boolean().default(true),
  price: z.coerce.number().min(0).max(1000000).default(0),
  currency: z.string().default("INR"),
  validityDays: z.coerce.number().min(0).max(3650).default(365),
  published: z.boolean().default(false),
});

export const subjectSchema = z.object({
  courseId: z.coerce.number().int().positive("Select a course"),
  name: z.string().trim().min(2, "Subject name is required").max(200),
  nameMr: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  orderIndex: z.coerce.number().int().min(1).default(1),
});

export const chapterSchema = z.object({
  courseId: z.coerce.number().int().positive("Select a course"),
  subjectId: z.coerce.number().int().positive("Select a subject"),
  title: z.string().trim().min(2, "Chapter title is required").max(200),
  titleMr: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  orderIndex: z.coerce.number().int().min(1).default(1),
});

export const lectureSchema = z.object({
  courseId: z.coerce.number().int().positive("Select a course"),
  subjectId: z.coerce.number().int().optional().nullable(),
  chapterId: z.coerce.number().int().optional().nullable(),
  title: z.string().trim().min(3, "Lecture title is required").max(220),
  titleMr: z.string().trim().max(220).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  youtubeUrl: z.string().trim().optional().or(z.literal("")),
  youtubeId: z.string().trim().max(40).optional().or(z.literal("")),
  durationMin: z.coerce.number().min(0).max(1000).default(0),
  thumbnailUrl: z.string().trim().optional().or(z.literal("")),
  orderIndex: z.coerce.number().int().min(1).default(1),
  isFree: z.boolean().default(false),
  published: z.boolean().default(false),
});

export const pdfSchema = z.object({
  courseId: z.coerce.number().int().positive("Select a course"),
  subjectId: z.coerce.number().int().optional().nullable(),
  chapterId: z.coerce.number().int().optional().nullable(),
  title: z.string().trim().min(3, "PDF title is required").max(220),
  titleMr: z.string().trim().max(220).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  fileUrl: z.string().trim().min(4, "PDF URL is required"),
  fileSizeKb: z.coerce.number().min(0).default(0),
  pageCount: z.coerce.number().min(0).default(0),
  isFree: z.boolean().default(false),
  allowDownload: z.boolean().default(true),
  published: z.boolean().default(false),
});

export const questionSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  text: z.string().trim().min(3, "Question text is required"),
  textMr: z.string().trim().optional().or(z.literal("")),
  options: z.array(z.string().trim().min(1, "All four options are required")).length(4),
  correctIndex: z.coerce.number().int().min(0).max(3),
  explanation: z.string().trim().optional().or(z.literal("")),
  marks: z.coerce.number().min(0.25).max(20).default(1),
  negativeMarks: z.coerce.number().min(0).max(10).default(0),
});

export const quizSchema = z.object({
  courseId: z.coerce.number().int().positive("Select a course"),
  subjectId: z.coerce.number().int().optional().nullable(),
  chapterId: z.coerce.number().int().optional().nullable(),
  title: z.string().trim().min(3, "Quiz title is required").max(220),
  titleMr: z.string().trim().max(220).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  timeLimitMin: z.coerce.number().min(1).max(300).default(15),
  passingPercent: z.coerce.number().min(0).max(100).default(40),
  isFree: z.boolean().default(true),
  published: z.boolean().default(false),
  questions: z.array(questionSchema).default([]),
});

export const attemptSchema = z.object({
  answers: z.record(z.string(), z.coerce.number().int().min(-1).max(3)),
  timeTakenSec: z.coerce.number().min(0).max(60 * 60 * 6).default(0),
});

export const progressSchema = z.object({
  lectureId: z.coerce.number().int().positive(),
  positionSec: z.coerce.number().min(0).default(0),
  percent: z.coerce.number().min(0).max(100).default(0),
  completed: z.boolean().default(false),
});

export const notificationSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(200),
  titleMr: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  bodyMr: z.string().trim().max(2000).optional().or(z.literal("")),
  kind: z.enum(["lecture", "quiz", "announcement", "update"]).default("update"),
  audience: z.enum(["ALL", "COURSE"]).default("ALL"),
  courseId: z.coerce.number().int().optional().nullable(),
});

export const SCHEMAS = {
  courses: courseSchema,
  subjects: subjectSchema,
  chapters: chapterSchema,
  lectures: lectureSchema,
  pdfs: pdfSchema,
  quizzes: quizSchema,
};
