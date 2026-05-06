import { z } from "zod";

export const levelSchema = z.object({
  id: z.string().startsWith("lvl_"),
  slug: z.string().min(2).max(50),
  name: z.string().min(2),
  nameAr: z.string().min(2),
  description: z.string().min(10),
  descriptionAr: z.string().min(10),
});

export const lessonSchema = z.object({
  id: z.string().startsWith("lsn_"),
  levelId: z.string().startsWith("lvl_"),
  slug: z.string().min(2),
  title: z.string().min(2),
  titleAr: z.string().min(2),
  description: z.string().min(10),
  descriptionAr: z.string().min(10),
  order: z.number().int().positive(),
});

export const categorySchema = z.object({
  id: z.string().startsWith("cat_"),
  slug: z.string().min(2),
  title: z.string().min(2),
  titleAr: z.string().min(2),
  type: z.enum(["quran", "general"]),
});

export const wordSchema = z.object({
  id: z.string().startsWith("w_"),
  lessonId: z.string().startsWith("lsn_").nullable(),
  categoryId: z.string().startsWith("cat_").nullable(),
  en: z.string().min(1),
  ar: z.string().min(1),
  exampleEn: z.string().optional(),
  exampleAr: z.string().optional(),
  examples: z.array(z.object({
    en: z.string().min(1),
    ar: z.string().min(1),
  })).optional(),
  audioUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => {
  // Must belong to exactly one: either a lesson or a category
  const hasLesson = data.lessonId !== null && data.lessonId !== undefined;
  const hasCategory = data.categoryId !== null && data.categoryId !== undefined;
  return (hasLesson && !hasCategory) || (!hasLesson && hasCategory);
}, {
  message: "Word must belong to exactly one lesson or one category.",
  path: ["lessonId", "categoryId"],
});
