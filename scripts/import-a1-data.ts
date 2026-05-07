import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const ExampleSchema = z.object({ en: z.string().trim(), ar: z.string().trim() });
const WordSchema = z.object({
  id: z.string(),
  lessonId: z.string().nullable(),
  en: z.string().trim(),
  translation: z.string().trim().optional(),
  ar: z.string().trim(),
  pronunciation: z.string().trim().optional().default(''),
  type: z.string().default('word'),
  examples: z.array(ExampleSchema).default([]),
  difficulty: z.string().default('A1'),
  tags: z.array(z.string()).default([]),
  confidence: z.string().default('high'),
  needsTranslationReview: z.boolean().default(false),
  categoryId: z.string().nullable().optional(),
});
const LessonSchema = z.object({ id: z.string(), levelId: z.string(), title: z.string().trim(), slug: z.string().trim(), order: z.number(), wordCount: z.number() });
const LevelSchema = z.object({ id: z.string(), title: z.string().trim().optional(), slug: z.string().trim(), order: z.number().default(1) });

type Word = z.infer<typeof WordSchema>;
type Lesson = z.infer<typeof LessonSchema>;
type Level = z.infer<typeof LevelSchema>;

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function createBackup(files: string[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join('src/data/backups', timestamp);
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  for (const file of files) { if (fs.existsSync(file)) fs.copyFileSync(file, path.join(backupDir, path.basename(file))); }
  return backupDir;
}

interface RawWordEntry { en: string; translation: string; pronunciation: string; examples: { en: string; ar: string }[]; letter: string; }

function parseA1File(filePath: string): RawWordEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const entries: RawWordEntry[] = [];
  let currentLetter = 'A';
  let currentEntry: Partial<RawWordEntry> | null = null;

  const pushEntry = () => {
    if (currentEntry && currentEntry.en) {
      entries.push({
        en: currentEntry.en.trim(),
        translation: (currentEntry.translation || '').trim(),
        pronunciation: (currentEntry.pronunciation || '').trim(),
        examples: [...(currentEntry.examples || [])],
        letter: currentLetter,
      });
    }
    currentEntry = null;
  };

  const processText = (text: string) => {
    if (!currentEntry) return;
    if (text.includes('Translation:') || text.includes('Pronunciation:') || text.includes('Examples:')) {
      const parts = text.split(/(Translation:|Pronunciation:|Examples:)/);
      let currentField = '';
      parts.forEach(p => {
        if (p === 'Translation:') currentField = 'translation';
        else if (p === 'Pronunciation:') currentField = 'pronunciation';
        else if (p === 'Examples:') currentField = 'examples';
        else if (p.trim()) {
           const val = p.trim();
           if (currentField === 'translation') currentEntry!.translation = val;
           else if (currentField === 'pronunciation') currentEntry!.pronunciation = val;
           else if (currentField === 'examples') processExampleLine(val, currentEntry!);
        }
      });
    } else {
      processExampleLine(text, currentEntry!);
    }
  };

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Detect LETTER anywhere and update currentLetter, then strip it
    const letterMatch = line.match(/LETTER\s+([A-Z])/i);
    if (letterMatch) {
      currentLetter = letterMatch[1].toUpperCase();
      line = line.replace(/LETTER\s+[A-Z](\s+&\s+[A-Z])?/i, '').trim();
      if (!line) continue;
    }

    if (line.includes('Word:')) {
      const parts = line.split('Word:');
      if (parts[0].trim()) {
        processText(parts[0].trim());
      }
      for (let i = 1; i < parts.length; i++) {
        pushEntry();
        currentEntry = { en: '', translation: '', pronunciation: '', examples: [], letter: currentLetter };
        const segment = parts[i].trim();
        const subFields = segment.split(/(Translation:|Pronunciation:|Examples:)/);
        currentEntry.en = subFields[0].trim();
        let currentField = '';
        for (let j = 1; j < subFields.length; j++) {
           const f = subFields[j];
           if (f === 'Translation:') currentField = 'translation';
           else if (f === 'Pronunciation:') currentField = 'pronunciation';
           else if (f === 'Examples:') currentField = 'examples';
           else if (f.trim()) {
             const val = f.trim();
             if (currentField === 'translation') currentEntry.translation = val;
             else if (currentField === 'pronunciation') currentEntry.pronunciation = val;
             else if (currentField === 'examples') processExampleLine(val, currentEntry);
           }
        }
      }
    } else {
      processText(line);
    }
  }
  pushEntry();
  return entries;
}

function processExampleLine(line: string, entry: Partial<RawWordEntry>) {
  const pairParts = line.split(/\s{3,}/);
  pairParts.forEach(part => {
    const text = part.trim();
    if (!text) return;
    const isArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
    if (!entry.examples) entry.examples = [];
    if (isArabic) {
      const lastExample = entry.examples[entry.examples.length - 1];
      if (lastExample && !lastExample.ar) lastExample.ar = text;
      else entry.examples.push({ en: '', ar: text });
    } else {
      entry.examples.push({ en: text, ar: '' });
    }
  });
}

async function run() {
  const WORDS_PATH = 'src/data/words.json';
  const LESSONS_PATH = 'src/data/lessons.json';
  const LEVELS_PATH = 'src/data/levels.json';
  const INPUT_PATH = 'data/structured/a1-clean.txt';
  try {
    createBackup([WORDS_PATH, LESSONS_PATH, LEVELS_PATH]);
    let existingWords: Word[] = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf-8'));
    let existingLessons: Lesson[] = JSON.parse(fs.readFileSync(LESSONS_PATH, 'utf-8'));
    let existingLevels: Level[] = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf-8'));
    const rawEntries = parseA1File(INPUT_PATH);
    const entriesByLetter: Record<string, RawWordEntry[]> = {};
    rawEntries.forEach(entry => { if (!entriesByLetter[entry.letter]) entriesByLetter[entry.letter] = []; entriesByLetter[entry.letter].push(entry); });
    const newWords: Word[] = [];
    const newLessons: Lesson[] = [];
    let lessonOrder = 1;
    const sortedLetters = Object.keys(entriesByLetter).sort();
    for (const letter of sortedLetters) {
      const chunks = [];
      const letterEntries = entriesByLetter[letter];
      for (let i = 0; i < letterEntries.length; i += 25) chunks.push(letterEntries.slice(i, i + 25));
      chunks.forEach((chunk, index) => {
        const lessonId = `lsn_a1_${letter.toLowerCase()}_${index + 1}`;
        newLessons.push({ id: lessonId, levelId: 'lvl_1', title: `${letter} Words - Part ${index + 1}`, slug: `${letter.toLowerCase()}-words-${index + 1}`, order: lessonOrder++, wordCount: chunk.length });
        chunk.forEach(raw => {
          const wordEntry: Word = { id: `w_a1_${slugify(raw.en)}`, lessonId, en: raw.en, translation: raw.translation, ar: raw.translation, pronunciation: raw.pronunciation, type: 'word', examples: raw.examples.filter(ex => ex.en.trim() && ex.ar.trim()), difficulty: 'A1', tags: ['A1', 'core'], confidence: 'high', needsTranslationReview: false };
          const existing = newWords.find(w => w.en.toLowerCase() === raw.en.toLowerCase());
          if (existing) raw.examples.forEach(newEx => { if (newEx.en && newEx.ar && !existing.examples.find(ex => ex.en === newEx.en)) existing.examples.push(newEx); });
          else newWords.push(wordEntry);
        });
      });
    }
    const finalWords = [...existingWords.filter(w => !w.tags?.includes('A1') && !w.id?.startsWith('w_a1_')).map(w => ({ ...w, translation: w.translation || w.ar, pronunciation: w.pronunciation || '', type: w.type || 'word', difficulty: w.difficulty || 'A1', tags: w.tags || [], confidence: w.confidence || 'high', needsTranslationReview: w.needsTranslationReview ?? false, examples: w.examples || [] })), ...newWords];
    const finalLessons = [...existingLessons.filter(lsn => !lsn.id.startsWith('lsn_a1_')), ...newLessons];
    const finalLevels = existingLevels.map(l => ({ ...l, title: l.title || l.slug.toUpperCase(), order: l.order || 1 }));
    finalWords.forEach(w => WordSchema.parse(w));
    finalLessons.forEach(lsn => LessonSchema.parse(lsn));
    finalLevels.forEach(lvl => LevelSchema.parse(lvl));
    fs.writeFileSync(WORDS_PATH, JSON.stringify(finalWords, null, 2));
    fs.writeFileSync(LESSONS_PATH, JSON.stringify(finalLessons, null, 2));
    fs.writeFileSync(LEVELS_PATH, JSON.stringify(finalLevels, null, 2));
    console.log('🎉 Pipeline completed successfully with letter grouping!');
  } catch (error) { console.error('❌ Pipeline FAILED:', error); process.exit(1); }
}
run();
