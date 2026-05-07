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
  lessonId: z.string().startsWith("lsn_").nullable().optional(),
  levelId: z.string().startsWith("lvl_").optional(),
  categoryId: z.string().nullable().optional(),
  en: z.string().min(1),
  ar: z.string().min(1),
  pronunciation: z.string().optional(),
  exampleEn: z.string().optional(),
  exampleAr: z.string().optional(),
  examples: z.array(z.object({
    en: z.string().min(1),
    ar: z.string().min(1),
  })).optional(),
  audioUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  type: z.string().optional(),
  difficulty: z.string().optional(),
  confidence: z.string().optional(),
});
