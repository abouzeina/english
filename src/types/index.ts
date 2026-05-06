export interface Level {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
}

export interface Lesson {
  id: string;
  levelId: string;
  slug: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  order: number;
}

export interface Category {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  type: string;
}

export interface Example {
  en: string;
  ar: string;
}

export interface WordItem {
  id: string;
  lessonId: string | null;
  categoryId: string | null;
  en: string;
  ar: string;
  exampleEn?: string;
  exampleAr?: string;
  examples?: Example[];
  audioUrl?: string;
  tags?: string[];
}
