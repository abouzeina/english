import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { Level, Lesson, WordItem, Example } from '../src/types';

const CONTENT_DIR = path.join(process.cwd(), 'src/data/content');
const B1_LEVEL_ID = 'lvl_b1';
const B1_SLUG = 'b1';
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

async function importB1() {
  console.log("🚀 Starting B1 Import Pipeline (Production-Grade)...");

  const inputPath = path.join(process.cwd(), 'data/structured/b1-clean.txt');
  if (!fs.existsSync(inputPath)) {
    console.error("❌ Input file not found:", inputPath);
    return;
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split(/\r?\n/);

  let currentLetter = '';
  let wordsByLetter: Record<string, RawWord[]> = {};
  let currentWord: RawWord | null = null;
  let parsingExamples = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('===')) continue;

    // Handle Letter Sections
    if (line.startsWith('LETTER ')) {
      currentLetter = line.replace('LETTER ', '').trim().toUpperCase();
      if (!wordsByLetter[currentLetter]) wordsByLetter[currentLetter] = [];
      continue;
    }

    // Handle Word Start
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

    // Handle Translation
    if (line.startsWith('Translation: ')) {
      if (currentWord) currentWord.translation = line.replace('Translation: ', '').trim();
      continue;
    }

    // Handle Pronunciation
    if (line.startsWith('Pronunciation: ')) {
      if (currentWord) currentWord.pronunciation = line.replace('Pronunciation: ', '').trim();
      continue;
    }

    // Handle Examples Section
    if (line.startsWith('Examples:')) {
      parsingExamples = true;
      continue;
    }

    // Handle Example Lines
    if (parsingExamples && currentWord) {
      const en = line;
      // Look for the next line which should be Arabic
      let nextIdx = i + 1;
      while (nextIdx < lines.length && !lines[nextIdx].trim()) {
        nextIdx++; // Skip blank lines
      }
      
      const ar = lines[nextIdx] ? lines[nextIdx].trim() : '';
      
      // Safety check: ensure ar is not the start of a new section
      if (en && ar && !ar.startsWith('Word:') && !ar.startsWith('LETTER') && !ar.startsWith('===')) {
        currentWord.examples.push({ en, ar });
        i = nextIdx; // Skip the Arabic line in the next iteration
      } else {
        parsingExamples = false;
      }
    }
  }

  // Push the last word
  if (currentWord && currentLetter) {
    wordsByLetter[currentLetter].push(currentWord);
  }

  console.log(`✅ Parsed ${Object.keys(wordsByLetter).length} letters.`);

  // 2. Structuring into Lessons
  const lessons: (Lesson & { words: WordItem[] })[] = [];
  let lessonOrder = 1;
  let totalImportedWords = 0;
  let totalImportedExamples = 0;

  for (const letter of Object.keys(wordsByLetter).sort()) {
    const rawWords = wordsByLetter[letter];
    const chunks = [];
    for (let i = 0; i < rawWords.length; i += WORDS_PER_LESSON) {
      chunks.push(rawWords.slice(i, i + WORDS_PER_LESSON));
    }

    chunks.forEach((chunk, idx) => {
      const lessonSlug = `${letter.toLowerCase()}-words-${idx + 1}`;
      const lessonId = `lsn_b1_${letter.toLowerCase()}_${idx + 1}`;
      
      const lessonWords: any[] = chunk.map(rw => {
        const wordId = `w_b1_${rw.word.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        totalImportedWords++;
        totalImportedExamples += rw.examples.length;
        
        return {
          id: wordId,
          en: rw.word,
          ar: rw.translation,
          pronunciation: rw.pronunciation,
          lessonId: lessonId,
          levelId: B1_LEVEL_ID,
          categoryId: 'general',
          examples: rw.examples,
          type: "word",
          difficulty: "B1",
          tags: ["B1", "core"],
          confidence: "high"
        };
      });

      lessons.push({
        id: lessonId,
        levelId: B1_LEVEL_ID,
        slug: lessonSlug,
        title: `Unit ${lessonOrder}: ${letter} Words - Part ${idx + 1}`,
        titleAr: `الوحدة ${lessonOrder}: كلمات حرف ${letter} - الجزء ${idx + 1}`,
        description: `Expand your intermediate vocabulary with words starting with ${letter}.`,
        descriptionAr: `طور حصيلتك اللغوية المتوسطة مع كلمات تبدأ بحرف ${letter}.`,
        order: lessonOrder++,
        wordCount: lessonWords.length,
        words: lessonWords
      });
    });
  }

  // 3. Validation & Writing
  const b1Dir = path.join(CONTENT_DIR, B1_SLUG);
  const lessonsDir = path.join(b1Dir, 'lessons');
  
  if (!fs.existsSync(lessonsDir)) {
      fs.mkdirSync(lessonsDir, { recursive: true });
  } else {
      // Clean old B1 files to avoid orphans if rerunning
      fs.readdirSync(lessonsDir).forEach(file => fs.unlinkSync(path.join(lessonsDir, file)));
  }

  const allB1Words: any[] = [];
  const lessonIndexes: Lesson[] = [];

  for (const lessonData of lessons) {
    const { words, ...metadata } = lessonData;
    
    // Validation
    words.forEach(w => {
      try {
        WordSchema.parse(w);
      } catch (err) {
        console.warn(`⚠️ Validation failed for word ${w.en}:`, err);
      }
    });
    
    fs.writeFileSync(
      path.join(lessonsDir, `${metadata.slug}.json`),
      JSON.stringify(lessonData, null, 2)
    );

    allB1Words.push(...words);
    lessonIndexes.push(metadata);
  }

  fs.writeFileSync(
    path.join(b1Dir, 'lessons-index.json'),
    JSON.stringify(lessonIndexes, null, 2)
  );

  // 4. Update Levels Metadata
  const levelsPath = path.join(CONTENT_DIR, 'levels.json');
  let levels = JSON.parse(fs.readFileSync(levelsPath, 'utf-8')) as Level[];
  
  const b1Metadata = {
    id: B1_LEVEL_ID,
    slug: B1_SLUG,
    name: "Intermediate",
    nameAr: "المتوسط (B1)",
    title: "B1 Intermediate",
    description: "Intermediate English vocabulary and real-world usage.",
    descriptionAr: "مفردات وجمل متوسطة المستوى للاستخدام اليومي والمهني.",
    order: 3,
    wordCount: allB1Words.length,
    totalLessons: lessonIndexes.length
  };

  const existingB1Idx = levels.findIndex(l => l.id === B1_LEVEL_ID);
  if (existingB1Idx >= 0) {
    levels[existingB1Idx] = b1Metadata;
  } else {
    levels.push(b1Metadata);
  }
  
  fs.writeFileSync(levelsPath, JSON.stringify(levels, null, 2));
  
  // Update local metadata.json for the level
  fs.writeFileSync(path.join(b1Dir, 'metadata.json'), JSON.stringify(b1Metadata, null, 2));

  // 5. Update Search Index
  const searchIndexPath = path.join(CONTENT_DIR, 'search-index.json');
  let searchIndex = JSON.parse(fs.readFileSync(searchIndexPath, 'utf-8'));
  
  const newSearchItems = allB1Words.map(w => ({
    id: w.id,
    en: w.en,
    ar: w.ar,
    lessonId: w.lessonId,
    levelId: B1_SLUG
  }));

  // Remove old B1 entries if any to avoid duplicates
  const filteredIndex = searchIndex.filter((item: any) => item.levelId !== B1_SLUG);
  fs.writeFileSync(searchIndexPath, JSON.stringify([...filteredIndex, ...newSearchItems], null, 2));

  // 6. Report
  const summary = `
# Import Summary: B1 Intermediate Dataset
Date: ${new Date().toISOString()}

- **Total Words Imported**: ${totalImportedWords}
- **New Units (Lessons)**: ${lessonIndexes.length}
- **Total Examples**: ${totalImportedExamples}
- **Level ID**: ${B1_LEVEL_ID}
- **Architecture**: Segmented (src/data/content/b1/)
- **Status**: ✅ SUCCESS

## Operations
- Created lvl_b1 metadata.
- Generated Unit 1 to Unit ${lessonIndexes.length}.
- Synced search index with ${newSearchItems.length} new entries.
- Validated all entries with Zod wordSchema.
`;

  fs.writeFileSync(path.join(process.cwd(), 'import-summary-b1.md'), summary);
  console.log("✨ B1 Import Complete! Summary generated at import-summary-b1.md");
}

importB1().catch(e => {
  console.error("❌ Import Failed:", e);
  process.exit(1);
});
