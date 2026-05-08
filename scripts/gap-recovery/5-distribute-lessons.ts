import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'src/data/content');
const MAX_WORDS = 25;

interface Word {
  id: string;
  lessonId: string;
  en: string;
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
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
}

function normalizeStr(str: string): string {
    return str.toLowerCase().replace(/['’‘]/g, "'").replace(/["“”]/g, '"').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

function chunkBalanced(words: Word[]): Word[][] {
    if (words.length <= MAX_WORDS) return [words];
    
    const chunks: Word[][] = [];
    const numChunks = Math.ceil(words.length / MAX_WORDS);
    const baseSize = Math.floor(words.length / numChunks);
    const remainder = words.length % numChunks;
    
    let startIndex = 0;
    for (let i = 0; i < numChunks; i++) {
        // Add 1 extra word to the first few chunks to distribute the remainder evenly
        const size = baseSize + (i < remainder ? 1 : 0);
        chunks.push(words.slice(startIndex, startIndex + size));
        startIndex += size;
    }
    
    return chunks;
}

async function run() {
    const levels = ['a1', 'a2', 'b1', 'b2', 'c1'];
    
    for (const level of levels) {
        const levelDir = path.join(CONTENT_DIR, level);
        const lessonsDir = path.join(levelDir, 'lessons');
        if (!fs.existsSync(lessonsDir)) continue;

        // Collect all words
        let allWords: Word[] = [];
        const oldFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));
        
        for (const file of oldFiles) {
            try {
                const content = fs.readFileSync(path.join(lessonsDir, file), 'utf-8');
                const cleanContent = content.substring(0, content.lastIndexOf('}') + 1);
                const lesson: Lesson = JSON.parse(cleanContent);
                allWords = allWords.concat(lesson.words);
            } catch (e) {
                console.error('Failed to load ' + file, e);
            }
        }
        
        if (allWords.length === 0) continue;

        // Sort alphabetically
        allWords.sort((a, b) => normalizeStr(a.en).localeCompare(normalizeStr(b.en)));

        // Group by starting letter
        const byLetter = new Map<string, Word[]>();
        for (const word of allWords) {
            let letter = normalizeStr(word.en).charAt(0);
            if (!/[a-z]/.test(letter)) letter = 'misc'; // Handle numbers or symbols just in case
            if (!byLetter.has(letter)) byLetter.set(letter, []);
            byLetter.get(letter)!.push(word);
        }

        // Wipe old lesson files except the folder itself
        for (const file of oldFiles) {
            fs.unlinkSync(path.join(lessonsDir, file));
        }

        const lessonsIndex: any[] = [];
        let orderCounter = 1;

        // Distribute and save new files
        const letters = Array.from(byLetter.keys()).sort();
        for (const letter of letters) {
            const letterWords = byLetter.get(letter)!;
            const chunks = chunkBalanced(letterWords);
            
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const partLabel = chunks.length > 1 ? ' - Part ' + (i + 1) : '';
                const partLabelAr = chunks.length > 1 ? ' - الجزء ' + (i + 1) : '';
                
                const title = 'Unit ' + orderCounter + ': ' + letter.toUpperCase() + ' Words' + partLabel;
                const titleAr = 'الوحدة ' + orderCounter + ': كلمات حرف ' + letter.toUpperCase() + partLabelAr;
                const slug = letter + '-words' + (chunks.length > 1 ? '-' + (i + 1) : '');
                const lessonId = 'lsn_' + level + '_' + letter + (chunks.length > 1 ? '_' + (i + 1) : '');
                
                // Update words with new lessonId
                for (const w of chunk) {
                    w.lessonId = lessonId;
                }

                const descEn = 'Master essential ' + level.toUpperCase() + ' vocabulary starting with the letter ' + letter.toUpperCase() + '.';
                const descAr = 'طور حصيلتك اللغوية في المستوى ' + level.toUpperCase() + ' مع كلمات تبدأ بحرف ' + letter.toUpperCase() + '.';

                const newLesson: Lesson = {
                    id: lessonId,
                    levelId: 'lvl_' + level,
                    title: title,
                    slug: slug,
                    order: orderCounter,
                    wordCount: chunk.length,
                    titleAr: titleAr,
                    description: descEn,
                    descriptionAr: descAr,
                    words: chunk
                };
                
                fs.writeFileSync(path.join(lessonsDir, slug + '.json'), JSON.stringify(newLesson, null, 2) + '\n');
                
                lessonsIndex.push({
                    id: lessonId,
                    levelId: 'lvl_' + level,
                    slug: slug,
                    title: title,
                    titleAr: titleAr,
                    description: descEn,
                    descriptionAr: descAr,
                    order: orderCounter,
                    wordCount: chunk.length
                });
                
                orderCounter++;
            }
        }
        
        // Update lessons-index.json
        fs.writeFileSync(path.join(levelDir, 'lessons-index.json'), JSON.stringify(lessonsIndex, null, 2) + '\n');
        console.log('Successfully distributed ' + allWords.length + ' words into ' + lessonsIndex.length + ' balanced lessons for level ' + level.toUpperCase() + '.');
    }

    // Build global search index
    console.log("Rebuilding global search index...");
    const globalSearchItems: any[] = [];
    for (const level of levels) {
        const levelDir = path.join(CONTENT_DIR, level);
        const lessonsDir = path.join(levelDir, 'lessons');
        if (!fs.existsSync(lessonsDir)) continue;

        const files = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(lessonsDir, file), 'utf-8');
                const cleanContent = content.substring(0, content.lastIndexOf('}') + 1);
                const lesson: Lesson = JSON.parse(cleanContent);
                
                for (const w of lesson.words) {
                    globalSearchItems.push({
                        id: w.id,
                        en: w.en,
                        ar: w.translation || w.ar,
                        levelId: lesson.levelId,
                        lessonId: lesson.id,
                        lessonSlug: lesson.slug,
                        type: w.type || 'word'
                    });
                }
            } catch (e) {}
        }
    }
    
    // Write the search index next to the main data
    fs.writeFileSync(path.join(CONTENT_DIR, 'search-index.json'), JSON.stringify(globalSearchItems, null, 2) + '\n');
    console.log('Successfully built global search index with ' + globalSearchItems.length + ' entries.');
}

run().catch(console.error);
