import fs from 'fs';
import path from 'path';
import { levelSchema, lessonSchema, wordSchema, categorySchema } from '../src/lib/validation/content-schemas';

const dataDir = path.join(process.cwd(), 'src/data');

function validateFile(filename: string, schema: any) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ File not found: ${filename} (Skipping)`);
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.trim()) return [];
    
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
        console.warn(`⚠️ ${filename} is not an array (Skipping)`);
        return data;
    }

    const parsed = schema.array().safeParse(data);

    if (!parsed.success) {
      console.error(`❌ Validation failed for ${filename}:`);
      // Safer way to access errors
      const errors = (parsed as any).error?.errors || (parsed as any).error?.issues || [];
      errors.forEach((err: any) => {
        console.error(`   - Row [${err.path[0]}], Field [${err.path[1]}]: ${err.message}`);
      });
      process.exit(1);
    }

    // Check for duplicate IDs
    const ids = new Set();
    data.forEach((item: any, index: number) => {
      if (item.id && ids.has(item.id)) {
        console.error(`❌ Validation failed for ${filename}:`);
        console.error(`   - Duplicate ID found: ${item.id} at index ${index}`);
        process.exit(1);
      }
      if (item.id) ids.add(item.id);
    });

    console.log(`✅ ${filename} passed validation.`);
    return data;
  } catch (e) {
    console.error(`❌ Error parsing/validating ${filename}:`, e);
    process.exit(1);
  }
}

console.log("🔍 Validating Content JSON Files...");
const levels = validateFile('levels.json', levelSchema);
const lessons = validateFile('lessons.json', lessonSchema);
const categories = validateFile('categories.json', categorySchema);
const words = validateFile('words.json', wordSchema);

// Note: Segmented content in src/data/content/ is validated during import.
// This script focuses on the monolithic files used for initial hydration.

console.log("🔗 Validating Relations...");

const levelIds = new Set(levels.map((l: any) => l.id));
const lessonIds = new Set(lessons.map((l: any) => l.id));
const categoryIds = new Set(categories.map((c: any) => c.id));

let relationErrors = 0;

if (Array.isArray(lessons)) {
    lessons.forEach((lesson: any, index: number) => {
      if (!levelIds.has(lesson.levelId)) {
        console.error(`❌ Relation Error in lessons.json [Row ${index}]: levelId '${lesson.levelId}' does not exist in levels.json`);
        relationErrors++;
      }
    });
}

if (Array.isArray(words)) {
    words.forEach((word: any, index: number) => {
      if (word.lessonId && !lessonIds.has(word.lessonId) && !word.lessonId.startsWith('lsn_a2')) {
        // Skip A2 lessons as they are in segmented files, not in monolithic lessons.json
        console.error(`❌ Relation Error in words.json [Row ${index}]: lessonId '${word.lessonId}' does not exist in lessons.json`);
        relationErrors++;
      }
      if (word.categoryId && !categoryIds.has(word.categoryId) && word.categoryId !== 'general') {
        console.error(`❌ Relation Error in words.json [Row ${index}]: categoryId '${word.categoryId}' does not exist in categories.json`);
        relationErrors++;
      }
    });
}

if (relationErrors > 0) {
  console.error(`💥 Content validation failed with ${relationErrors} relational errors.`);
  process.exit(1);
}

console.log("🎉 All content validated successfully!");
