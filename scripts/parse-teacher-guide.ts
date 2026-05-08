import fs from 'fs';
import path from 'path';

const inputPath = path.join(process.cwd(), 'data/teacher-guide/teacher-guide.txt');
const outputPath = path.join(process.cwd(), 'src/data/content/categories/cat_quran_1.json');

function parse() {
  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    return;
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const sections = content.split('==================================================').filter(s => s.trim());
  
  const subcategories = [];
  let subId = 1;

  for (const section of sections) {
    const lines = section.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) continue;

    let categoryTitle = '';
    const words = [];
    let currentWord: any = null;

    for (const line of lines) {
      if (line.startsWith('CATEGORY:')) {
        categoryTitle = line.replace('CATEGORY:', '').trim();
      } else if (line.startsWith('Arabic:')) {
        if (currentWord) words.push(currentWord);
        currentWord = { id: `w_quran_sub_${subId}_${words.length + 1}`, ar: '', en: '', note: '' };
      } else if (line.startsWith('English:')) {
        // Next lines will be English
      } else if (line.startsWith('Type:')) {
        // Ignore type for now
      } else if (line.startsWith('Notes:')) {
        // Next lines will be notes
      } else {
        // It's content
        if (currentWord) {
          // Check which field we are in
          const prevLineIdx = lines.indexOf(line) - 1;
          const prevLine = lines[prevLineIdx];
          
          if (prevLine === 'Arabic:') {
            currentWord.ar = line;
          } else if (prevLine === 'English:') {
            currentWord.en = line;
          } else if (prevLine === 'Notes:') {
            currentWord.note = line === ' ' ? '' : line;
          }
        }
      }
    }
    if (currentWord) words.push(currentWord);

    if (categoryTitle) {
      subcategories.push({
        id: `sub_${subId}`,
        titleAr: categoryTitle,
        wordCount: words.length,
        words: words
      });
      subId++;
    }
  }

  const result = {
    id: "cat_quran_1",
    slug: "classroom",
    title: "Classroom Phrases",
    titleAr: "جمل الشرح في الحصة",
    type: "quran",
    words: [],
    subcategories: subcategories
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log('Successfully updated cat_quran_1.json with', subcategories.length, 'subcategories.');
}

parse();
