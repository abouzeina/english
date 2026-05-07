import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src/data');
const CONTENT_DIR = path.join(DATA_DIR, 'content');

// Helper to ensure directory exists
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

async function segmentData() {
  console.log("🚀 Starting data segmentation...");

  // 1. Read monolithic files
  const levels = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'levels.json'), 'utf-8'));
  const lessons = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'lessons.json'), 'utf-8'));
  const words = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'words.json'), 'utf-8'));
  const categories = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'categories.json'), 'utf-8'));

  ensureDir(CONTENT_DIR);

  // 2. Save levels metadata (Top-level)
  fs.writeFileSync(
    path.join(CONTENT_DIR, 'levels.json'),
    JSON.stringify(levels, null, 2)
  );

  // 3. Save categories (Top-level)
  fs.writeFileSync(
    path.join(CONTENT_DIR, 'categories.json'),
    JSON.stringify(categories, null, 2)
  );

  for (const level of levels) {
    const levelSlug = level.slug || level.id;
    const levelDir = path.join(CONTENT_DIR, levelSlug);
    const lessonsDir = path.join(levelDir, 'lessons');

    ensureDir(lessonsDir);

    // Save level metadata
    fs.writeFileSync(
      path.join(levelDir, 'metadata.json'),
      JSON.stringify(level, null, 2)
    );

    // Get lessons for this level
    const levelLessons = lessons.filter((l: any) => l.levelId === level.id);

    for (const lesson of levelLessons) {
      const lessonSlug = lesson.slug || lesson.id;
      
      // Get words for this lesson
      const lessonWords = words.filter((w: any) => w.lessonId === lesson.id);

      const lessonData = {
        ...lesson,
        words: lessonWords
      };

      // Save lesson file
      fs.writeFileSync(
        path.join(lessonsDir, `${lessonSlug}.json`),
        JSON.stringify(lessonData, null, 2)
      );
    }

    // Save lessons index for this level
    fs.writeFileSync(
      path.join(levelDir, 'lessons-index.json'),
      JSON.stringify(levelLessons, null, 2)
    );

    console.log(`✅ Segmented level: ${level.name} (${levelLessons.length} lessons)`);
  }

  // 4. Create Category Chunks (Words grouped by category)
  console.log("📂 Segmenting categories...");
  const categoryDir = path.join(CONTENT_DIR, 'categories');
  ensureDir(categoryDir);

  for (const category of categories) {
    const categoryWords = words.filter((w: any) => w.categoryId === category.id);
    if (categoryWords.length > 0) {
      fs.writeFileSync(
        path.join(categoryDir, `${category.id}.json`),
        JSON.stringify({ ...category, words: categoryWords }, null, 2)
      );
    }
  }

  // 5. Create a lightweight Search Index
  console.log("🔍 Generating lightweight search index...");
  const searchIndex = words.map((w: any) => ({
    id: w.id,
    en: w.en,
    ar: w.ar,
    lessonId: w.lessonId,
    levelId: w.levelId
  }));

  fs.writeFileSync(
    path.join(CONTENT_DIR, 'search-index.json'),
    JSON.stringify(searchIndex, null, 2)
  );

  console.log("✨ Segmentation complete!");
}

segmentData().catch(console.error);
