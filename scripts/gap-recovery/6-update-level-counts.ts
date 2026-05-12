import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'src/data/content');
const LEVELS_FILE = path.join(CONTENT_DIR, 'levels.json');

async function run() {
    const levelsData = JSON.parse(fs.readFileSync(LEVELS_FILE, 'utf-8'));
    const levelSlugs = ['a1', 'a2', 'b1', 'b2', 'c1'];
    
    for (const slug of levelSlugs) {
        const levelDir = path.join(CONTENT_DIR, slug);
        const lessonsIndexFile = path.join(levelDir, 'lessons-index.json');
        
        if (fs.existsSync(lessonsIndexFile)) {
            const lessons = JSON.parse(fs.readFileSync(lessonsIndexFile, 'utf-8'));
            const totalWords = lessons.reduce((sum: number, l: any) => sum + l.wordCount, 0);
            
            const levelEntry = levelsData.find((l: any) => l.slug === slug);
            if (levelEntry) {
                levelEntry.wordCount = totalWords;
                levelEntry.totalLessons = lessons.length;
                console.log(`Updated ${slug}: ${totalWords} words, ${lessons.length} lessons`);
            }
        }
    }
    
    fs.writeFileSync(LEVELS_FILE, JSON.stringify(levelsData, null, 2) + '\n');
    console.log('Successfully updated levels.json');
}

run().catch(console.error);
