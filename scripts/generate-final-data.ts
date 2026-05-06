import fs from 'fs';
import path from 'path';

/**
 * GOLDEN DATASET VERIFICATION LAYER
 * Developed for: Wafi Platform
 * Focus: UI Compatibility, Linguistic Scrubbing, Final Schema
 */

const INPUT_FILE = path.join(process.cwd(), 'scripts/auto-accepted.json');
const PREVIEW_FILE = path.join(process.cwd(), 'scripts/verified-preview.json');

const MAX_WORDS_PER_LESSON = 25;

interface RawEntry {
  en: string;
  ipa?: string;
  examples: Array<{ en: string; ar: string }>;
  levelId: string;
  lessonId: string;
}

interface FinalWord {
  id: string;
  lessonId: string;
  en: string;
  translation: string;
  pronunciation: string;
  type: string;
  examples: Array<{ en: string; ar: string }>;
  difficulty: string;
  confidence: string;
  needsTranslationReview: boolean;
  exampleCount: number;
  tags: string[];
}

function scrubSentence(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/ \./g, ".")
    .replace(/ \?/g, "?")
    .replace(/ ,/g, ",")
    .trim();
}

function generateFinalData(limit: number = 50) {
  console.log(`✨ Starting Golden Dataset Generation (Limit: ${limit})`);

  if (!fs.existsSync(INPUT_FILE)) {
    console.error("Error: auto-accepted.json not found. Run the import pipeline first.");
    return;
  }

  const rawData: RawEntry[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const finalWords: FinalWord[] = [];
  
  // Group by alphabetical lesson
  const letterGroups: Record<string, RawEntry[]> = {};
  rawData.forEach(entry => {
    const letter = entry.en[0].toLowerCase();
    if (!letterGroups[letter]) letterGroups[letter] = [];
    letterGroups[letter].push(entry);
  });

  // Process each group into balanced lessons
  Object.entries(letterGroups).forEach(([letter, entries]) => {
    const lessonCount = Math.ceil(entries.length / MAX_WORDS_PER_LESSON);
    
    for (let i = 0; i < lessonCount; i++) {
      const lessonId = `lsn_a1_${letter}_${i + 1}`;
      const batch = entries.slice(i * MAX_WORDS_PER_LESSON, (i + 1) * MAX_WORDS_PER_LESSON);
      
      batch.forEach(entry => {
        if (finalWords.length >= limit) return;

        const slug = entry.en.toLowerCase().replace(/[^a-z0-9]/g, "-");
        
        finalWords.push({
          id: `w_a1_${slug}`,
          lessonId: lessonId,
          en: entry.en,
          translation: "",
          pronunciation: entry.ipa || "",
          type: entry.en.includes(" ") ? "phrase" : "word",
          examples: entry.examples.map(ex => ({
            en: scrubSentence(ex.en),
            ar: scrubSentence(ex.ar)
          })),
          difficulty: "A1",
          confidence: "high",
          needsTranslationReview: true,
          exampleCount: entry.examples.length,
          tags: ["A1", "core"]
        });
      });
    }
  });

  fs.writeFileSync(PREVIEW_FILE, JSON.stringify(finalWords, null, 2), 'utf-8');
  console.log(`✅ Verified Preview saved to scripts/verified-preview.json`);
  console.log(`Total Words Processed: ${finalWords.length}`);
}

generateFinalData(50);
