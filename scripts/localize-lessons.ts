import fs from 'fs';
import path from 'path';

async function localizeAndClean() {
  const LESSONS_PATH = path.join(process.cwd(), 'src/data/lessons.json');
  const WORDS_PATH = path.join(process.cwd(), 'src/data/words.json');
  
  const lessons = JSON.parse(fs.readFileSync(LESSONS_PATH, 'utf-8'));
  const words = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf-8'));

  const updatedLessons = lessons.map((lesson: any) => {
    const count = words.filter((w: any) => w.lessonId === lesson.id).length;
    
    // If it's one of our generated A1 lessons, also update titles
    if (lesson.id.startsWith('lsn_a1_')) {
      const letter = lesson.id.split('_')[2].toUpperCase();
      const part = lesson.id.split('_')[3];
      
      return {
        ...lesson,
        title: `${letter} Words - Part ${part}`,
        titleAr: `كلمات حرف ${letter} - الجزء ${part}`,
        description: `Learn essential A1 vocabulary starting with the letter ${letter}.`,
        descriptionAr: `تعلم كلمات المستوى A1 الأساسية التي تبدأ بحرف ${letter}.`,
        wordCount: count
      };
    }
    
    // For legacy lessons, just update wordCount if missing
    return {
      ...lesson,
      wordCount: count
    };
  });

  fs.writeFileSync(LESSONS_PATH, JSON.stringify(updatedLessons, null, 2));
  console.log('✅ Lessons localized and word counts updated.');
}

localizeAndClean();
