import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const CONTENT_DIR = path.join(process.cwd(), 'src/data/content');
const GENERATED_DIR = path.join(process.cwd(), 'scripts', 'gap-recovery', 'generated');
const WARNINGS_FILE = path.join(process.cwd(), 'manual-review-warnings.json');

const ExampleSchema = z.object({
  en: z.string().min(5),
  ar: z.string().min(3)
});

const GeneratedWordSchema = z.object({
  en: z.string().min(1),
  translation: z.string().min(1),
  ipa: z.string().regex(/^\/.*\//).optional(), // Must be surrounded by slashes if exists
  type: z.enum(['word', 'phrase', 'expression', 'idiom']).catch('word'),
  examples: z.array(ExampleSchema).min(1)
});

interface Word {
  id: string;
  lessonId: string;
  en: string;
  ar: string;
  translation: string;
  type: string;
  examples: {en: string, ar: string}[];
  difficulty: string;
  tags: string[];
  confidence: string;
  needsTranslationReview: boolean;
  ipa?: string;
}

interface Lesson {
  id: string;
  levelId: string;
  title: string;
  slug: string;
  order: number;
  wordCount: number;
  words: Word[];
}

function normalizeStr(str: string): string {
    return str.toLowerCase().replace(/['’‘]/g, "'").replace(/["“”]/g, '"').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

async function run() {
    if (!fs.existsSync(GENERATED_DIR)) {
        console.log("No generated files found.");
        return;
    }

    const files = fs.readdirSync(GENERATED_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        console.log("No generated files found to process.");
        return;
    }

    let warnings: any[] = [];
    if (fs.existsSync(WARNINGS_FILE)) {
        warnings = JSON.parse(fs.readFileSync(WARNINGS_FILE, 'utf-8'));
    }

    const ipaQueuePath = path.join(process.cwd(), 'ipa-review-queue.json');
    let ipaQueue: any[] = [];
    if (fs.existsSync(ipaQueuePath)) {
        ipaQueue = JSON.parse(fs.readFileSync(ipaQueuePath, 'utf-8'));
    }

    // Load existing recovered lessons per level
    const fileMap = new Map<string, Lesson>();
    let processedCount = 0;
    let warningCount = 0;

    // Preload ALL existing words for the level to prevent duplicates across any lesson
    const allExistingWords = new Set<string>();
    const levelDirsProcessed = new Set<string>();

    for (const file of files) {
        // e.g. b1-batch-12345.json
        const match = file.match(/^([a-c][1-2])-batch/i);
        if (!match) continue;

        const level = match[1].toLowerCase(); // b1

        // Load all existing words for this level if not already loaded
        if (!levelDirsProcessed.has(level)) {
            const lessonsDir = path.join(CONTENT_DIR, level, 'lessons');
            if (fs.existsSync(lessonsDir)) {
                const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));
                for (const lf of lessonFiles) {
                    try {
                        const content = fs.readFileSync(path.join(lessonsDir, lf), 'utf-8');
                        const cleanContent = content.substring(0, content.lastIndexOf('}') + 1);
                        const lesson: Lesson = JSON.parse(cleanContent);
                        for (const w of lesson.words) {
                            allExistingWords.add(normalizeStr(w.en));
                        }
                    } catch(e) {}
                }
            }
            levelDirsProcessed.add(level);
        }

        const targetLessonId = 'lsn_' + level + '_recovered';
        const targetLessonPath = path.join(CONTENT_DIR, level, 'lessons', 'recovered.json');
        
        if (!fileMap.has(targetLessonPath)) {
            if (fs.existsSync(targetLessonPath)) {
                try {
                    const content = fs.readFileSync(targetLessonPath, 'utf-8');
                    const cleanContent = content.substring(0, content.lastIndexOf('}') + 1);
                    fileMap.set(targetLessonPath, JSON.parse(cleanContent));
                } catch(e) {
                    fileMap.set(targetLessonPath, {
                        id: targetLessonId,
                        levelId: 'lvl_' + level,
                        title: level.toUpperCase() + ' Recovered Words',
                        slug: 'recovered',
                        order: 999,
                        wordCount: 0,
                        words: []
                    });
                }
            } else {
                fileMap.set(targetLessonPath, {
                    id: targetLessonId,
                    levelId: 'lvl_' + level,
                    title: level.toUpperCase() + ' Recovered Words',
                    slug: 'recovered',
                    order: 999,
                    wordCount: 0,
                    words: []
                });
            }
        }

        const targetLesson = fileMap.get(targetLessonPath)!;
        const data = JSON.parse(fs.readFileSync(path.join(GENERATED_DIR, file), 'utf-8'));
        
        for (const item of data) {
            // Validation
            const parseResult = GeneratedWordSchema.safeParse(item);
            if (!parseResult.success) {
                warnings.push({
                    word: item.en || 'unknown',
                    reason: 'Schema validation failed',
                    errors: parseResult.error.issues,
                    raw: item
                });
                warningCount++;
                continue;
            }

            const validItem = parseResult.data;

            // Strict Anti-AI & Quality validations
            if (validItem.translation.includes('تعني') || validItem.translation.length > 50) {
                 warnings.push({
                    word: validItem.en,
                    reason: 'Translation looks too long, conversational or literal',
                    raw: validItem
                });
                warningCount++;
                continue;
            }

            const aiPatterns = [
                'this is very important', 'he was happy to', 'she likes to', 
                'ai ', 'language model', 'as an ai', 'example of', 'it is important to'
            ];
            
            const lowerExample = validItem.examples[0].en.toLowerCase();
            const hasAiPattern = aiPatterns.some(p => lowerExample.includes(p));

            if (hasAiPattern || validItem.examples[0].en.length > 120) {
                 warnings.push({
                    word: validItem.en,
                    reason: 'Example is generic AI pattern or too long',
                    raw: validItem
                });
                warningCount++;
                continue;
            }

            // IPA Validation
            let ipaValid = true;
            if (!validItem.ipa || !validItem.ipa.startsWith('/') || !validItem.ipa.endsWith('/') || validItem.ipa.length < 3) {
                ipaValid = false;
                ipaQueue.push({
                    word: validItem.en,
                    reason: 'Malformed or missing IPA',
                    raw: validItem
                });
                // We don't skip the merge entirely, just don't set IPA or flag it for review.
                // The prompt says: "لا تقم بالmerge مباشرة. ضع الكلمة داخل ipa-review-queue.json"
                // So we will skip merge!
                warningCount++;
                continue;
            }

            // Check if word already exists ANYWHERE in this level to prevent duplicates
            if (allExistingWords.has(normalizeStr(validItem.en))) {
                console.log('Word ' + validItem.en + ' already exists in ' + level + '. Skipping.');
                continue;
            }

            // Mark as added to prevent duplicates within the same batch
            allExistingWords.add(normalizeStr(validItem.en));

            // Construct new word object
            const slug = validItem.en.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const newWord: Word = {
                id: 'w_' + level + '_' + slug,
                lessonId: targetLessonId,
                en: validItem.en,
                ar: validItem.translation,
                translation: validItem.translation,
                type: validItem.type,
                difficulty: level.toUpperCase(),
                tags: [level.toUpperCase(), 'oxford5000', 'recovered'],
                confidence: 'high',
                needsTranslationReview: false,
                examples: validItem.examples,
                ipa: validItem.ipa
            };

            targetLesson.words.push(newWord);
            processedCount++;
        }

        // Rename to .processed
        fs.renameSync(path.join(GENERATED_DIR, file), path.join(GENERATED_DIR, file + '.processed'));
    }

    for (const [filePath, lesson] of fileMap.entries()) {
        lesson.wordCount = lesson.words.length;
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        lesson.words.sort((a, b) => a.en.localeCompare(b.en));
        fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2) + '\n');
    }

    fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));
    fs.writeFileSync(ipaQueuePath, JSON.stringify(ipaQueue, null, 2));

    console.log('Successfully merged ' + processedCount + ' generated words. Warnings logged: ' + warningCount);
}

run().catch(console.error);
