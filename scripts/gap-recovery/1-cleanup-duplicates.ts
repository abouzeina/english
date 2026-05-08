import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'src/data/content');
const DUPLICATES_FILE = path.join(process.cwd(), 'duplicate-words.json');
const OXFORD_FILE = path.join(process.cwd(), 'official-oxford-5000.json');

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
  pronunciation?: string;
  levelId?: string;
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

function loadOxfordLevels(): Record<string, string> {
    const data = JSON.parse(fs.readFileSync(OXFORD_FILE, 'utf-8'));
    const map: Record<string, string> = {};
    for (const entry of data) {
        map[entry.word.toLowerCase()] = entry.level;
    }
    return map;
}

function normalizeStr(str: string): string {
    return str.toLowerCase().replace(/['’‘]/g, "'").replace(/["“”]/g, '"').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

async function run() {
    if (!fs.existsSync(DUPLICATES_FILE)) {
        console.error("duplicate-words.json not found!");
        return;
    }
    const duplicates: {word: string, count: number, levels: string[]}[] = JSON.parse(fs.readFileSync(DUPLICATES_FILE, 'utf-8'));
    const oxfordLevels = loadOxfordLevels();
    
    // Map of filepath -> Lesson
    const fileMap = new Map<string, Lesson>();
    const filesToSave = new Set<string>();
    
    // Load all lessons
    const levels = ['a1', 'a2', 'b1', 'b2', 'c1'];
    for (const level of levels) {
        const lessonsDir = path.join(CONTENT_DIR, level, 'lessons');
        if (!fs.existsSync(lessonsDir)) continue;
        for (const file of fs.readdirSync(lessonsDir)) {
            if (!file.endsWith('.json')) continue;
            const filePath = path.join(lessonsDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                // quick fix for trailing characters if any
                const cleanContent = content.substring(0, content.lastIndexOf('}') + 1);
                fileMap.set(filePath, JSON.parse(cleanContent));
            } catch (e) {
                console.error('Failed to parse ' + filePath, e);
            }
        }
    }

    let report = '# Duplicate Cleanup Report\\n\\n';
    let mergedCount = 0;

    for (const dup of duplicates) {
        const normTarget = normalizeStr(dup.word);
        
        // Find all instances of this word across all files
        const instances: {filePath: string, index: number, word: Word}[] = [];
        
        for (const [filePath, lesson] of fileMap.entries()) {
            lesson.words.forEach((w, index) => {
                if (normalizeStr(w.en) === normTarget) {
                    instances.push({filePath, index, word: w});
                }
            });
        }
        
        if (instances.length <= 1) continue; // Not a duplicate anymore

        // Sort instances to pick the "best" base entry
        // Best: High confidence, has IPA, has more examples
        instances.sort((a, b) => {
            if (a.word.confidence === 'high' && b.word.confidence !== 'high') return -1;
            if (a.word.confidence !== 'high' && b.word.confidence === 'high') return 1;
            const aIpa = a.word.ipa || a.word.pronunciation;
            const bIpa = b.word.ipa || b.word.pronunciation;
            if (aIpa && !bIpa) return -1;
            if (!aIpa && bIpa) return 1;
            return b.word.examples.length - a.word.examples.length;
        });

        const bestInstance = instances[0];
        const mergedWord = { ...bestInstance.word };
        
        // Merge data from other instances
        const existingExamples = new Set(mergedWord.examples.map(e => normalizeStr(e.en)));
        const existingTags = new Set(mergedWord.tags);
        
        for (let i = 1; i < instances.length; i++) {
            const inst = instances[i];
            
            // Merge examples
            for (const ex of inst.word.examples) {
                if (!existingExamples.has(normalizeStr(ex.en))) {
                    mergedWord.examples.push(ex);
                    existingExamples.add(normalizeStr(ex.en));
                }
            }
            // Merge tags
            for (const t of inst.word.tags) {
                if (!existingTags.has(t)) {
                    mergedWord.tags.push(t);
                    existingTags.add(t);
                }
            }
        }
        
        // Update level if necessary based on Oxford
        const officialLevel = oxfordLevels[normTarget] || mergedWord.difficulty;
        
        // Replace in best instance file
        const targetLesson = fileMap.get(bestInstance.filePath)!;
        targetLesson.words[bestInstance.index] = mergedWord;
        filesToSave.add(bestInstance.filePath);
        
        report += '### ' + dup.word + '\n';
        report += '- **Kept**: ' + mergedWord.id + ' in ' + path.basename(bestInstance.filePath) + '\n';
        report += '- **Official Level**: ' + officialLevel + '\n';
        report += '- **Merged ' + (instances.length - 1) + ' duplicates**:\n';

        // Remove from other files
        for (let i = 1; i < instances.length; i++) {
            const inst = instances[i];
            const lessonToUpdate = fileMap.get(inst.filePath)!;
            // Since we might remove multiple from same file, better to filter by ID
            lessonToUpdate.words = lessonToUpdate.words.filter(w => w.id !== inst.word.id);
            lessonToUpdate.wordCount = lessonToUpdate.words.length;
            filesToSave.add(inst.filePath);
            report += '  - Removed ' + inst.word.id + ' from ' + path.basename(inst.filePath) + '\n';
        }
        report += '\n';
        mergedCount++;
    }

    report = '# Duplicate Cleanup Report\n**Total Words Merged:** ' + mergedCount + '\n\n' + report.replace('# Duplicate Cleanup Report\n\n', '');

    // Save files
    for (const filePath of filesToSave) {
        const lesson = fileMap.get(filePath)!;
        lesson.wordCount = lesson.words.length; // Ensure accurate count
        fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2) + '\\n');
    }
    
    fs.writeFileSync(path.join(process.cwd(), 'duplicate-cleanup-report.md'), report);
    console.log('Successfully cleaned ' + mergedCount + ' duplicates.');
}

run().catch(console.error);
