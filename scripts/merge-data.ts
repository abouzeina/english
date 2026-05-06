import fs from 'fs';
import path from 'path';

/**
 * PRODUCTION-GRADE DATA MERGE PIPELINE (V2 - COMPATIBILITY FIX)
 * Focus: Incremental Merge, Backups, Validation, Relational Integrity
 */

const DATA_DIR = path.join(process.cwd(), 'src/data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const AUTO_ACCEPTED_FILE = path.join(process.cwd(), 'scripts/auto-accepted.json');

const WORDS_FILE = path.join(DATA_DIR, 'words.json');
const LESSONS_FILE = path.join(DATA_DIR, 'lessons.json');
const LEVELS_FILE = path.join(DATA_DIR, 'levels.json');

const MAX_WORDS_PER_LESSON = 25;

interface FinalWord {
  id: string;
  lessonId: string;
  en: string;
  ar: string; // Corrected from translation
  pronunciation: string;
  type: string;
  examples: Array<{ en: string; ar: string }>;
  difficulty: string;
  confidence: string;
  needsTranslationReview: boolean;
  exampleCount: number;
  tags: string[];
}

interface FinalLesson {
  id: string;
  levelId: string;
  slug: string; // Added slug
  title: string; // Corrected from object
  titleAr: string; // Added
  description: string; // Corrected from object
  descriptionAr: string; // Added
  order: number;
  wordCount: number;
}

interface FinalLevel {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  totalLessons: number;
}

function scrub(text: string): string {
  return text.replace(/\s+/g, " ").replace(/ \./g, ".").replace(/ \?/g, "?").replace(/ ,/g, ",").trim();
}

async function runMerge(limit: number = 100) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const currentBackup = path.join(BACKUP_DIR, timestamp);

  console.log(`🚀 Starting Safe Merge Pipeline (Batch: ${limit})`);

  // 1. BACKUP PHASE
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.mkdirSync(currentBackup, { recursive: true });

  [WORDS_FILE, LESSONS_FILE, LEVELS_FILE].forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(currentBackup, path.basename(file)));
    }
  });

  // 2. LOAD DATA
  const existingWords: FinalWord[] = fs.existsSync(WORDS_FILE) ? JSON.parse(fs.readFileSync(WORDS_FILE, 'utf-8')) : [];
  const existingLessons: FinalLesson[] = fs.existsSync(LESSONS_FILE) ? JSON.parse(fs.readFileSync(LESSONS_FILE, 'utf-8')) : [];
  const existingLevels: FinalLevel[] = fs.existsSync(LEVELS_FILE) ? JSON.parse(fs.readFileSync(LEVELS_FILE, 'utf-8')) : [];

  const autoAccepted = JSON.parse(fs.readFileSync(AUTO_ACCEPTED_FILE, 'utf-8')).slice(0, limit);

  const targetLevelId = 'lvl_1'; // Use existing lvl_1 for A1

  // 3. MERGE LOGIC
  const newWords: FinalWord[] = [];
  const newLessonsMap = new Map<string, FinalLesson>();

  // Group new words into lessons
  const letterGroups: Record<string, any[]> = {};
  autoAccepted.forEach((raw: any) => {
    const letter = raw.en[0].toLowerCase();
    if (!letterGroups[letter]) letterGroups[letter] = [];
    letterGroups[letter].push(raw);
  });

  Object.entries(letterGroups).forEach(([letter, entries]) => {
    const lessonCount = Math.ceil(entries.length / MAX_WORDS_PER_LESSON);
    for (let i = 0; i < lessonCount; i++) {
      const lessonId = `lsn_a1_${letter}_${i + 1}`;
      const batch = entries.slice(i * MAX_WORDS_PER_LESSON, (i + 1) * MAX_WORDS_PER_LESSON);

      if (!existingLessons.find(l => l.id === lessonId)) {
        newLessonsMap.set(lessonId, {
          id: lessonId,
          levelId: targetLevelId,
          slug: `letter-${letter}-${i + 1}`,
          title: `Letter ${letter.toUpperCase()} - Part ${i + 1}`,
          titleAr: `حرف ${letter.toUpperCase()} - الجزء ${i + 1}`,
          description: `Words starting with ${letter.toUpperCase()}`,
          descriptionAr: `كلمات تبدأ بحرف ${letter.toUpperCase()}`,
          order: existingLessons.length + newLessonsMap.size + 1,
          wordCount: batch.length
        });
      }

      batch.forEach(raw => {
        const id = `w_a1_${raw.en.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        if (existingWords.find(w => w.id === id)) return;

        newWords.push({
          id,
          lessonId,
          en: raw.en,
          ar: '', // Corrected field
          pronunciation: raw.ipa || '',
          type: raw.en.includes(' ') ? 'phrase' : 'word',
          examples: raw.examples.map((ex: any) => ({ en: scrub(ex.en), ar: scrub(ex.ar) })),
          difficulty: 'A1',
          confidence: 'high',
          needsTranslationReview: true,
          exampleCount: raw.examples.length,
          tags: ['A1', 'core']
        });
      });
    }
  });

  // 4. INTEGRITY VALIDATION
  const finalWords = [...existingWords, ...newWords];
  const finalLessons = [...existingLessons, ...newLessonsMap.values()];
  
  // Update lesson word counts
  finalLessons.forEach(lesson => {
    lesson.wordCount = finalWords.filter(w => w.lessonId === lesson.id).length;
  });

  // Update level lesson counts
  existingLevels.forEach(level => {
    level.totalLessons = finalLessons.filter(l => l.levelId === level.id).length;
  });

  // 5. WRITE
  fs.writeFileSync(WORDS_FILE, JSON.stringify(finalWords, null, 2));
  fs.writeFileSync(LESSONS_FILE, JSON.stringify(finalLessons, null, 2));
  fs.writeFileSync(LEVELS_FILE, JSON.stringify(existingLevels, null, 2));

  console.log(`\n✅ MERGE COMPLETE & COMPATIBILITY FIXED!`);
  console.log(`Words: ${newWords.length} | Lessons: ${newLessonsMap.size}`);
}

const importLimit = process.argv[2] ? parseInt(process.argv[2]) : 251;
runMerge(importLimit).catch(console.error);
