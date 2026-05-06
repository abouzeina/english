import fs from 'fs';
import path from 'path';

const GENERATED_WORDS_COUNT = 1500;
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/words_large.json');

function generateWords() {
  const words = [];
  const baseWords = [
    { en: 'Abundant', ar: 'وفير' },
    { en: 'Brilliant', ar: 'متألق' },
    { en: 'Consistent', ar: 'متسق' },
    { en: 'Dynamic', ar: 'ديناميكي' },
    { en: 'Efficient', ar: 'فعال' },
    { en: 'Fluent', ar: 'فصيح' },
    { en: 'Grateful', ar: 'ممتن' },
    { en: 'Harmony', ar: 'انسجام' },
    { en: 'Insight', ar: 'بصيرة' },
    { en: 'Journey', ar: 'رحلة' }
  ];

  for (let i = 0; i < GENERATED_WORDS_COUNT; i++) {
    const base = baseWords[i % baseWords.length];
    words.push({
      id: `gen_${i}`,
      en: `${base.en} ${i}`,
      ar: `${base.ar} ${i}`,
      levelId: 'level-1',
      lessonId: 'lesson-1-1',
      exampleEn: `This is an example for ${base.en} number ${i}.`,
      exampleAr: `هذا مثال للكلمة رقم ${i}.`,
      tags: ['Generated', 'ScaleTest']
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(words, null, 2));
  console.log(`✅ Generated ${GENERATED_WORDS_COUNT} words at ${OUTPUT_FILE}`);
}

generateWords();
