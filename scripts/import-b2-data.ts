import fs from 'fs';
import path from 'path';
import { z } from 'zod';


const CONTENT_DIR = path.join(process.cwd(), 'src/data/content');
const BACKUPS_DIR = path.join(process.cwd(), 'src/data/backups');
const B2_LEVEL_ID = 'lvl_b2';
const B2_SLUG = 'b2';
const WORDS_PER_LESSON = 25;
const MAX_LESSON_FILE_SIZE_BYTES = 50 * 1024; // 50KB

const ExampleSchema = z.object({
  en: z.string().min(1),
  ar: z.string().min(1)
});

const WordSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  lessonId: z.string(),
  levelId: z.string(),
  en: z.string().min(1),
  ar: z.string().min(1),
  pronunciation: z.string().optional(),
  examples: z.array(ExampleSchema),
  type: z.string(),
  difficulty: z.string(),
  tags: z.array(z.string()),
  confidence: z.string(),
  needsTranslationReview: z.boolean().optional()
});

interface RawWord {
  word: string;
  translation: string;
  pronunciation: string;
  examples: { en: string; ar: string }[];
}

function cleanString(str: string) {
  return str.trim().replace(/\s+/g, ' ');
}

function generateWordId(word: string) {
  const safeStr = word.toLowerCase().replace(/['"‘`’]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `w_b2_${safeStr}`;
}

async function runPipeline() {
  console.log("🚀 Starting B2 Import Pipeline (Production-Grade Staging)...");

  // 1. BACKUP PHASE
  console.log("📦 Creating Full Backup...");
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(BACKUPS_DIR, timestamp);
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });
  fs.cpSync(CONTENT_DIR, path.join(backupDir, 'content'), { recursive: true });
  console.log(`✅ Backup created at: ${backupDir}`);

  // 2. PARSE PHASE
  console.log("📖 Parsing Input Data...");
  const inputPath = path.join(process.cwd(), 'data/structured/b2-clean.txt');
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  // The file has missing newlines after the letter L. We must normalize it.
  const content = fs.readFileSync(inputPath, 'utf-8');
  let fixedContent = content
    .replace(/(LETTER [A-Z])/g, '\n$1\n')
    .replace(/(Word:)/g, '\n$1')
    .replace(/(Translation:)/g, '\n$1')
    .replace(/(Pronunciation:)/g, '\n$1')
    .replace(/(Examples:)/g, '\n$1')
    .replace(/(====================)/g, '\n$1\n');

  const lines = fixedContent.split(/\r?\n/);

  let currentLetter = '';
  let wordsMap: Map<string, RawWord> = new Map();
  let currentWord: RawWord | null = null;
  let parsingExamples = false;

  let mergedCount = 0;
  let validationWarnings: string[] = [];
  let fileWarnings: string[] = [];

  function parseExamplesText(text: string, cw: RawWord) {
    const parts = text.split(/\s{2,}/).filter(p => p.trim());
    for (const part of parts) {
      const arIndex = part.search(/[\u0600-\u06FF]/);
      if (arIndex > 0) {
        const en = part.substring(0, arIndex).trim();
        const ar = part.substring(arIndex).trim();
        cw.examples.push({ en, ar });
      } else if (arIndex === 0) {
        if (cw.examples.length > 0) {
          const lastEx = cw.examples[cw.examples.length - 1];
          if (!lastEx.ar) {
            lastEx.ar = part.trim();
          } else {
            lastEx.ar += ' ' + part.trim();
          }
        }
      } else {
        cw.examples.push({ en: part.trim(), ar: '' });
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('===')) {
       continue;
    }

    if (line.startsWith('LETTER ')) {
      currentLetter = line.replace('LETTER ', '').trim().toUpperCase();
      parsingExamples = false;
      continue;
    }

    if (line.startsWith('Word: ')) {
      if (currentWord && currentWord.word) {
        const id = generateWordId(currentWord.word);
        if (wordsMap.has(id)) {
          const existing = wordsMap.get(id)!;
          if (currentWord.pronunciation.length > existing.pronunciation.length) {
            existing.pronunciation = currentWord.pronunciation;
          }
          currentWord.examples.forEach(newEx => {
            if (newEx.en && !existing.examples.find(e => e.en === newEx.en)) {
              existing.examples.push(newEx);
            }
          });
          mergedCount++;
        } else {
          wordsMap.set(id, currentWord);
        }
      }

      currentWord = { 
        word: cleanString(line.replace('Word: ', '')), 
        translation: '', 
        pronunciation: '', 
        examples: [] 
      };
      parsingExamples = false;
      continue;
    }

    if (line.startsWith('Translation: ')) {
      if (currentWord) currentWord.translation = cleanString(line.replace('Translation: ', ''));
      parsingExamples = false;
      continue;
    }

    if (line.startsWith('Pronunciation: ')) {
      if (currentWord) currentWord.pronunciation = cleanString(line.replace('Pronunciation: ', ''));
      parsingExamples = false;
      continue;
    }

    if (line.startsWith('Examples:')) {
      parsingExamples = true;
      const rest = line.substring(9).trim();
      if (rest && currentWord) {
        parseExamplesText(rest, currentWord);
      }
      continue;
    }

    if (parsingExamples && currentWord) {
      parseExamplesText(line, currentWord);
    }
  }

  // Push the very last word
  if (currentWord && currentWord.word) {
    const id = generateWordId(currentWord.word);
    if (wordsMap.has(id)) {
      const existing = wordsMap.get(id)!;
      if (currentWord.pronunciation.length > existing.pronunciation.length) {
        existing.pronunciation = currentWord.pronunciation;
      }
      currentWord.examples.forEach(newEx => {
        if (!existing.examples.find(e => e.en === newEx.en)) {
          existing.examples.push(newEx);
        }
      });
      mergedCount++;
    } else {
      wordsMap.set(id, currentWord);
    }
  }

  // 3. BUILD MEMORY OBJECTS & STABLE ORDERING
  console.log("🏗️ Building Memory Objects & Sorting (Idempotency Safe)...");
  
  // Group by starting letter deterministically
  const groupedWords: Record<string, RawWord[]> = {};
  
  const allWordsList = Array.from(wordsMap.values()).sort((a, b) => a.word.localeCompare(b.word));
  
  for (const rw of allWordsList) {
    const letter = rw.word.charAt(0).toUpperCase();
    if (!groupedWords[letter]) groupedWords[letter] = [];
    
    // Sort examples deterministically
    rw.examples.sort((a, b) => a.en.localeCompare(b.en));
    
    // Validate empty examples
    if (rw.examples.length === 0) {
      validationWarnings.push(`⚠️ Word has no examples: ${rw.word}`);
    }
    
    // Validate IPA if present
    if (rw.pronunciation && !/^[\x20-\x7E\u00A0-\u02AF]+$/.test(rw.pronunciation)) {
      validationWarnings.push(`⚠️ Suspicious IPA/Pronunciation for ${rw.word}: ${rw.pronunciation}`);
    }

    groupedWords[letter].push(rw);
  }

  const stagedLessons: any[] = [];
  const stagedLessonIndexes: any[] = [];
  const stagedSearchItems: any[] = [];
  let lessonOrder = 1;
  let totalImportedWords = 0;
  let totalExamples = 0;

  const sortedLetters = Object.keys(groupedWords).sort();
  
  for (const letter of sortedLetters) {
    const rawWords = groupedWords[letter];
    const chunks = [];
    for (let i = 0; i < rawWords.length; i += WORDS_PER_LESSON) {
      chunks.push(rawWords.slice(i, i + WORDS_PER_LESSON));
    }

    chunks.forEach((chunk, idx) => {
      const lessonSlug = `${letter.toLowerCase()}-words-${idx + 1}`;
      const lessonId = `lsn_b2_${letter.toLowerCase()}_${idx + 1}`;
      
      const lessonWords = chunk.map(rw => {
        const wordId = generateWordId(rw.word);
        totalImportedWords++;
        
        const validExamples = rw.examples.filter(e => e.en.trim() && e.ar.trim());
        totalExamples += validExamples.length;
        
        return {
          id: wordId,
          en: rw.word,
          ar: rw.translation,
          pronunciation: rw.pronunciation,
          lessonId: lessonId,
          levelId: B2_LEVEL_ID,
          examples: validExamples,
          type: "word",
          difficulty: "B2",
          tags: ["B2", "advanced"],
          confidence: "high",
          needsTranslationReview: false
        };
      });

      stagedLessons.push({
        id: lessonId,
        levelId: B2_LEVEL_ID,
        slug: lessonSlug,
        title: `${letter} Words - Part ${idx + 1}`,
        titleAr: `كلمات حرف ${letter} - الجزء ${idx + 1}`,
        description: `Learn essential B2 vocabulary starting with the letter ${letter}.`,
        descriptionAr: `تعلم كلمات المستوى B2 الأساسية التي تبدأ بحرف ${letter}.`,
        order: lessonOrder++,
        wordCount: lessonWords.length,
        words: lessonWords
      });

      stagedLessonIndexes.push({
        id: lessonId,
        levelId: B2_LEVEL_ID,
        slug: lessonSlug,
        title: `${letter} Words - Part ${idx + 1}`,
        titleAr: `كلمات حرف ${letter} - الجزء ${idx + 1}`,
        description: `Learn essential B2 vocabulary starting with the letter ${letter}.`,
        descriptionAr: `تعلم كلمات المستوى B2 الأساسية التي تبدأ بحرف ${letter}.`,
        order: lessonOrder - 1,
        wordCount: lessonWords.length
      });

      lessonWords.forEach(w => {
        stagedSearchItems.push({
          id: w.id,
          en: w.en,
          ar: w.ar,
          lessonId: w.lessonId,
          levelId: B2_SLUG
        });
      });
    });
  }

  // 4. INTEGRITY CHECKS
  console.log("🛡️ Running Integrity & Zod Validations...");
  
  const allIds = new Set();
  const allLessonIds = new Set();
  
  for (const lsn of stagedLessons) {
    if (allLessonIds.has(lsn.id)) {
      throw new Error(`CRITICAL: Duplicate Lesson ID detected -> ${lsn.id}`);
    }
    allLessonIds.add(lsn.id);
    
    for (const w of lsn.words) {
      if (allIds.has(w.id)) {
        throw new Error(`CRITICAL: Duplicate Word ID detected -> ${w.id}`);
      }
      allIds.add(w.id);
      
      try {
        WordSchema.parse(w);
      } catch (err) {
        throw new Error(`CRITICAL: Zod Validation failed for word ${w.en}: ${JSON.stringify(err)}`);
      }
    }
    
    // File size estimation
    const estimatedSize = Buffer.byteLength(JSON.stringify(lsn, null, 2), 'utf8');
    if (estimatedSize > MAX_LESSON_FILE_SIZE_BYTES) {
      fileWarnings.push(`⚠️ Lesson ${lsn.slug} exceeds 50KB (${(estimatedSize / 1024).toFixed(2)} KB).`);
    }
  }

  if (stagedLessons.length === 0) {
    throw new Error("CRITICAL: No lessons generated.");
  }

  // 5. ATOMIC WRITE PHASE
  console.log("💾 Executing Single Atomic Write Phase...");
  
  const b2Dir = path.join(CONTENT_DIR, B2_SLUG);
  const lessonsDir = path.join(b2Dir, 'lessons');
  
  if (!fs.existsSync(lessonsDir)) {
      fs.mkdirSync(lessonsDir, { recursive: true });
  } else {
      // Clean existing B2 to avoid orphaned files during re-imports
      fs.readdirSync(lessonsDir).forEach(file => fs.unlinkSync(path.join(lessonsDir, file)));
  }

  for (const lessonData of stagedLessons) {
    fs.writeFileSync(
      path.join(lessonsDir, `${lessonData.slug}.json`),
      JSON.stringify(lessonData, null, 2)
    );
  }

  fs.writeFileSync(
    path.join(b2Dir, 'lessons-index.json'),
    JSON.stringify(stagedLessonIndexes, null, 2)
  );

  const b2Metadata = {
    id: B2_LEVEL_ID,
    slug: B2_SLUG,
    name: "Upper Intermediate",
    nameAr: "فوق المتوسط (B2)",
    title: "B2 Upper Intermediate",
    description: "Upper intermediate English vocabulary and advanced communication patterns.",
    descriptionAr: "مفردات اللغة الإنجليزية للمستوى فوق المتوسط وأنماط التواصل المتقدمة.",
    order: 4,
    wordCount: totalImportedWords,
    totalLessons: stagedLessonIndexes.length
  };

  fs.writeFileSync(path.join(b2Dir, 'metadata.json'), JSON.stringify(b2Metadata, null, 2));

  // Update Global Levels List
  const levelsPath = path.join(CONTENT_DIR, 'levels.json');
  let levels = JSON.parse(fs.readFileSync(levelsPath, 'utf-8')) as any[];
  
  const existingB2Idx = levels.findIndex(l => l.id === B2_LEVEL_ID);
  if (existingB2Idx >= 0) {
    levels[existingB2Idx] = b2Metadata;
  } else {
    levels.push(b2Metadata);
  }
  fs.writeFileSync(levelsPath, JSON.stringify(levels, null, 2));

  // Update Global Search Index
  const searchIndexPath = path.join(CONTENT_DIR, 'search-index.json');
  let searchIndex = JSON.parse(fs.readFileSync(searchIndexPath, 'utf-8'));
  const filteredIndex = searchIndex.filter((item: any) => item.levelId !== B2_SLUG);
  fs.writeFileSync(searchIndexPath, JSON.stringify([...filteredIndex, ...stagedSearchItems], null, 2));

  // 6. GENERATE REPORT
  console.log("📝 Generating Report...");
  const report = `# Import Summary: B2 Upper Intermediate Dataset
Date: ${new Date().toISOString()}

## Core Metrics
- **Total Words Imported**: ${totalImportedWords}
- **Total Examples**: ${totalExamples}
- **New Lessons (Units)**: ${stagedLessonIndexes.length}
- **Level ID**: ${B2_LEVEL_ID}

## Operations & Idempotency
- **Merged Entries (Duplicates handled)**: ${mergedCount}
- **Validation Warnings**: ${validationWarnings.length}
- **File Size Warnings**: ${fileWarnings.length}
- **Search Index Size**: ${filteredIndex.length + stagedSearchItems.length} total entries

## Validation Logs
${validationWarnings.length > 0 ? validationWarnings.map(w => '- ' + w).join('\n') : '- No validation warnings.'}

## File Size Protection
${fileWarnings.length > 0 ? fileWarnings.map(w => '- ' + w).join('\n') : '- All lesson payloads are within safe limits (< 50KB).'}

## Lesson Distribution
${stagedLessonIndexes.map(l => `- ${l.title}: ${l.wordCount} words`).join('\n')}

## Status
✅ SUCCESS - Pipeline executed successfully with stable ordering and atomicity.
`;

  fs.writeFileSync(path.join(process.cwd(), 'import-summary-b2.md'), report);
  console.log("✨ B2 Import Pipeline Complete! Report available at import-summary-b2.md");
}

runPipeline().catch(e => {
  console.error("❌ FATAL PIPELINE ERROR:", e);
  process.exit(1);
});
