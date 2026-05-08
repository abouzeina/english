const fs = require('fs');
const path = require('path');

const inputPath = path.join(process.cwd(), 'data/teacher-guide/teacher-guide.txt');
const outputPath = path.join(process.cwd(), 'src/data/content/categories/cat_quran_1.json');

const titleMapping = {
  "Greetings at the beginning of the class": "الترحيب في بداية الحصة",
  "Adjusting the sound and sharing the screen": "ضبط الصوت ومشاركة الشاشة",
  "Asking about the H.W and tasks": "السؤال عن الواجبات والمهام",
  "Directing and interaction during the class": "التوجيه والتفاعل أثناء الحصة",
  "Technical and internet connection's problems": "مشاكل التقنية والاتصال",
  "Excuses and apology": "الاعتذار والاستئذان",
  "Thanks and prayers": "الشكر والدعاء",
  "Encouragement and motivation": "التشجيع والتحفيز",
  "With kids": "التعامل مع الأطفال",
  "Financial agreements": "الاتفاقات المالية",
  "Scheduling and time differences": "المواعيد وفروق التوقيت",
  "Abbreviations": "الاختصارات",
  "Occasions and Seasons": "المناسبات والمواسم",
  "Parents Reports": "تقارير أولياء الأمور",
  "End of class": "نهاية الحصة",
  "Sounds and shapes of letters": "أصوات وأشكال الحروف",
  "Short and long vowels": "الحركات القصيرة والطويلة",
  "Sukoon & Tanween": "السكون والتنوين",
  "Tashdeed & secondary Madd": "التشديد والمد الفرعي",
  "Rules of Noon sakinah & Tanween": "أحكام النون الساكنة والتنوين",
  "Meem & Laam sakinah": "أحكام الميم واللام الساكنة",
  "Hamzatul wasl & Meeting two sakin letters": "همزة الوصل والتقاء الساكنين",
  "Stopping signs": "علامات الوقف"
};

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
    let currentWord = null;
    let currentField = '';

    for (const line of lines) {
      if (line.startsWith('CATEGORY:')) {
        categoryTitle = line.replace('CATEGORY:', '').trim();
      } else if (line.startsWith('Arabic:')) {
        if (currentWord) words.push(currentWord);
        currentWord = { id: `w_quran_sub_${subId}_${words.length + 1}`, ar: '', en: '', note: '' };
        currentField = 'ar';
      } else if (line.startsWith('English:')) {
        currentField = 'en';
      } else if (line.startsWith('Type:')) {
        currentField = 'type';
      } else if (line.startsWith('Notes:')) {
        currentField = 'note';
      } else {
        if (currentWord) {
          if (currentField === 'ar') currentWord.ar += (currentWord.ar ? ' ' : '') + line;
          else if (currentField === 'en') currentWord.en += (currentWord.en ? ' ' : '') + line;
          else if (currentField === 'note') currentWord.note += (currentWord.note ? ' ' : '') + line;
        }
      }
    }
    if (currentWord) words.push(currentWord);

    if (categoryTitle) {
      subcategories.push({
        id: `sub_${subId}`,
        titleAr: titleMapping[categoryTitle] || categoryTitle,
        titleEn: categoryTitle,
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

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log('Successfully updated cat_quran_1.json with', subcategories.length, 'subcategories.');
}

parse();
