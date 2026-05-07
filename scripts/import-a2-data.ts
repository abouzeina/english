import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { Level, Lesson, WordItem, Example } from '../src/types';

const CONTENT_DIR = path.join(process.cwd(), 'src/data/content');
const A2_LEVEL_ID = 'lvl_2';
const A2_SLUG = 'a2';
const WORDS_PER_LESSON = 25;

// Validation Schema
const ExampleSchema = z.object({
  en: z.string().min(1),
  ar: z.string().min(1)
});

const WordSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  levelId: z.string(),
  en: z.string().min(1),
  ar: z.string().min(1),
  pronunciation: z.string().optional(),
  examples: z.array(ExampleSchema),
  type: z.string(),
  difficulty: z.string(),
  tags: z.array(z.string()),
  confidence: z.string()
});

interface RawWord {
  word: string;
  translation: string;
  pronunciation: string;
  examples: Example[];
}

async function importA2() {
  console.log("🚀 Starting A2 Import Pipeline (Design Sync with A1)...");

  const inputPath = path.join(process.cwd(), 'data/structured/a2-clean.txt');
  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split(/\r?\n/);

  let currentLetter = '';
  let wordsByLetter: Record<string, RawWord[]> = {};
  let currentWord: RawWord | null = null;
  let parsingExamples = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('===')) continue;

    if (line.startsWith('LETTER ')) {
      currentLetter = line.replace('LETTER ', '').trim();
      wordsByLetter[currentLetter] = [];
      continue;
    }

    if (line.startsWith('Word: ')) {
      if (currentWord) {
        wordsByLetter[currentLetter].push(currentWord);
      }
      currentWord = { 
        word: line.replace('Word: ', '').trim(), 
        translation: '', 
        pronunciation: '', 
        examples: [] 
      };
      parsingExamples = false;
      continue;
    }

    if (line.startsWith('Translation: ')) {
      if (currentWord) currentWord.translation = line.replace('Translation: ', '').trim();
      continue;
    }

    if (line.startsWith('Pronunciation: ')) {
      if (currentWord) currentWord.pronunciation = line.replace('Pronunciation: ', '').trim();
      continue;
    }

    if (line.startsWith('Examples:')) {
      parsingExamples = true;
      continue;
    }

    if (parsingExamples && currentWord) {
      const en = line;
      const ar = lines[i+1] ? lines[i+1].trim() : '';
      
      if (en && ar && !ar.startsWith('Word:') && !ar.startsWith('LETTER') && !ar.startsWith('===')) {
        currentWord.examples.push({ en, ar });
        i++;
      } else {
        parsingExamples = false;
      }
    }
  }

  if (currentWord) {
    wordsByLetter[currentLetter].push(currentWord);
  }

  // 2. Structuring into Lessons
  const lessons: (Lesson & { words: WordItem[] })[] = [];
  let lessonOrder = 1;

  for (const letter of Object.keys(wordsByLetter).sort()) {
    const rawWords = wordsByLetter[letter];
    const chunks = [];
    for (let i = 0; i < rawWords.length; i += WORDS_PER_LESSON) {
      chunks.push(rawWords.slice(i, i + WORDS_PER_LESSON));
    }

    chunks.forEach((chunk, idx) => {
      const lessonSlug = `${letter.toLowerCase()}-words-${idx + 1}`;
      const lessonId = `lsn_a2_${letter.toLowerCase()}_${idx + 1}`;
      
      const lessonWords: any[] = chunk.map(rw => ({
        id: `w_a2_${rw.word.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        en: rw.word,
        ar: rw.translation,
        pronunciation: rw.pronunciation,
        lessonId: lessonId,
        levelId: A2_LEVEL_ID,
        categoryId: 'general',
        examples: rw.examples,
        type: "word",
        difficulty: "A2",
        tags: ["A2", "core"],
        confidence: "high"
      }));

      lessons.push({
        id: lessonId,
        levelId: A2_LEVEL_ID,
        slug: lessonSlug,
        title: `Unit ${lessonOrder}: ${letter} Words - Part ${idx + 1}`,
        titleAr: `الوحدة ${lessonOrder}: كلمات حرف ${letter} - الجزء ${idx + 1}`,
        description: `Build on your A2 vocabulary starting with the letter ${letter}.`,
        descriptionAr: `تعلم كلمات المستوى A2 الأساسية التي تبدأ بحرف ${letter}.`,
        order: lessonOrder++,
        wordCount: lessonWords.length,
        words: lessonWords as any
      });
    });
  }

  // 3. Validation & Writing
  const a2Dir = path.join(CONTENT_DIR, A2_SLUG);
  const lessonsDir = path.join(a2Dir, 'lessons');
  // Clear old lessons to avoid clutter from slug changes
  if (fs.existsSync(lessonsDir)) {
      fs.readdirSync(lessonsDir).forEach(file => fs.unlinkSync(path.join(lessonsDir, file)));
  } else {
      fs.mkdirSync(lessonsDir, { recursive: true });
  }

  const allA2Words: any[] = [];
  const lessonIndexes: Lesson[] = [];

  for (const lessonData of lessons) {
    const { words, ...metadata } = lessonData;
    words.forEach(w => WordSchema.parse(w));
    
    fs.writeFileSync(
      path.join(lessonsDir, `${metadata.slug}.json`),
      JSON.stringify(lessonData, null, 2)
    );

    allA2Words.push(...words);
    lessonIndexes.push(metadata);
  }

  fs.writeFileSync(
    path.join(a2Dir, 'lessons-index.json'),
    JSON.stringify(lessonIndexes, null, 2)
  );

  // 4. Update Global Files
  const levelsPath = path.join(CONTENT_DIR, 'levels.json');
  const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf-8')) as Level[];
  const a2Level = levels.find(l => l.slug === 'a2');
  if (a2Level) {
    a2Level.wordCount = allA2Words.length;
    (a2Level as any).totalLessons = lessonIndexes.length;
    fs.writeFileSync(levelsPath, JSON.stringify(levels, null, 2));
    const a2MetadataPath = path.join(CONTENT_DIR, 'a2', 'metadata.json');
    fs.writeFileSync(a2MetadataPath, JSON.stringify(a2Level, null, 2));
  }

  const searchIndexPath = path.join(CONTENT_DIR, 'search-index.json');
  const searchIndex = JSON.parse(fs.readFileSync(searchIndexPath, 'utf-8'));
  const newSearchItems = allA2Words.map(w => ({
    id: w.id,
    en: w.en,
    ar: w.ar,
    lessonId: w.lessonId,
    levelId: A2_SLUG
  }));

  const filteredIndex = searchIndex.filter((item: any) => !newSearchItems.some(ni => ni.id === item.id));
  fs.writeFileSync(searchIndexPath, JSON.stringify([...filteredIndex, ...newSearchItems], null, 2));

  const summary = `
# Import Summary: A2 Dataset (Design Sync)
Date: ${new Date().toISOString()}

- **Total Words**: ${allA2Words.length}
- **New Lessons**: ${lessonIndexes.length}
- **Metadata**: Synced with A1 schema (type, difficulty, tags, confidence)
- **Status**: Success
  `;

  fs.writeFileSync(path.join(process.cwd(), 'import-summary.md'), summary);
  console.log("✨ A2 Import Complete (Synced with A1 Design)!");
}

importA2().catch(e => {
  console.error("❌ Import Failed:", e);
  process.exit(1);
});
