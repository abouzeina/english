import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'src/data/content');
const MISPLACED_FILE = path.join(process.cwd(), 'misplaced-words.json');

interface Word {
  id: string;
  lessonId: string;
  levelId: string;
  en: string;
  difficulty: string;
  tags: string[];
  [key: string]: any;
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
    if (!fs.existsSync(MISPLACED_FILE)) {
        console.error("misplaced-words.json not found!");
        return;
    }
    const misplaced: {word: string, appLevel: string, oxfordLevel: string}[] = JSON.parse(fs.readFileSync(MISPLACED_FILE, 'utf-8'));
    
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
                const cleanContent = content.substring(0, content.lastIndexOf('}') + 1);
                fileMap.set(filePath, JSON.parse(cleanContent));
            } catch (e) {
                console.error('Failed to parse ' + filePath, e);
            }
        }
    }

    let report = '# Misplaced Words Recovery Report\n\n';
    let recoveredCount = 0;

    for (const item of misplaced) {
        const normTarget = normalizeStr(item.word);
        const targetOxfordLevel = item.oxfordLevel; // e.g., 'B1'
        const lowerOxfordLevel = targetOxfordLevel.toLowerCase(); // 'b1'
        
        // Find instance
        let foundWord: Word | null = null;
        let sourceFilePath = '';

        for (const [filePath, lesson] of fileMap.entries()) {
            const index = lesson.words.findIndex(w => normalizeStr(w.en) === normTarget);
            if (index !== -1) {
                foundWord = { ...lesson.words[index] };
                lesson.words.splice(index, 1);
                lesson.wordCount = lesson.words.length;
                filesToSave.add(filePath);
                sourceFilePath = filePath;
                break; // Assuming no duplicates since Phase 1 just ran
            }
        }
        
        if (!foundWord) {
            console.warn('Could not find word in app data: ' + item.word);
            continue;
        }

        // Update word properties
        const oldLevel = foundWord.levelId || item.appLevel;
        foundWord.difficulty = targetOxfordLevel;
        foundWord.levelId = 'lvl_' + lowerOxfordLevel;
        
        // Replace old level tag with new level tag
        const oldTagLevel = item.appLevel.toUpperCase();
        foundWord.tags = foundWord.tags.filter(t => t.toUpperCase() !== oldTagLevel);
        if (!foundWord.tags.includes(targetOxfordLevel)) {
            foundWord.tags.unshift(targetOxfordLevel);
        }

        // Place in recovered.json of the target level
        const targetLessonId = 'lsn_' + lowerOxfordLevel + '_recovered';
        foundWord.lessonId = targetLessonId;

        const targetLessonPath = path.join(CONTENT_DIR, lowerOxfordLevel, 'lessons', 'recovered.json');
        let targetLesson: Lesson;

        if (fileMap.has(targetLessonPath)) {
            targetLesson = fileMap.get(targetLessonPath)!;
        } else {
            // Check if it exists on disk but wasn't loaded (unlikely since we load all)
            targetLesson = {
                id: targetLessonId,
                levelId: 'lvl_' + lowerOxfordLevel,
                title: targetOxfordLevel + ' Recovered Words',
                slug: 'recovered',
                order: 999, // Will be sorted in Phase 4
                wordCount: 0,
                words: []
            };
            fileMap.set(targetLessonPath, targetLesson);
        }

        targetLesson.words.push(foundWord);
        targetLesson.wordCount = targetLesson.words.length;
        filesToSave.add(targetLessonPath);

        report += '- Moved `' + foundWord.en + '` from ' + oldLevel + ' to ' + targetOxfordLevel + '\n';
        recoveredCount++;
    }

    report = '**Total Words Recovered:** ' + recoveredCount + '\n\n' + report;

    // Save files
    for (const filePath of filesToSave) {
        const lesson = fileMap.get(filePath)!;
        // Make directory if it doesn't exist
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2) + '\n');
    }
    
    fs.writeFileSync(path.join(process.cwd(), 'misplaced-recovery-report.md'), report);
    console.log('Successfully recovered ' + recoveredCount + ' misplaced words.');
}

run().catch(console.error);
