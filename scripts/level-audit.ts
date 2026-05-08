import fs from 'fs';
import path from 'path';

interface Word {
  id: string;
  lessonId: string;
  en: string;
  translation?: string;
  ar?: string;
  ipa?: string;
  pronunciation?: string;
  examples?: Array<{ en: string; ar: string }>;
}

interface Lesson {
  id: string;
  levelId: string;
  words?: Word[];
}

const levels = ['a1', 'a2', 'b1', 'b2', 'c1'];
const contentPath = path.join(process.cwd(), 'src', 'data', 'content');

// Define some heuristic sets of basic words that should NOT appear in B2/C1
const basicWords = new Set([
  'about', 'above', 'add', 'after', 'again', 'against', 'age', 'ago', 'agree', 'air',
  'all', 'also', 'always', 'and', 'animal', 'answer', 'any', 'apple', 'area', 'arm',
  'around', 'arrive', 'art', 'ask', 'at', 'aunt', 'baby', 'back', 'bad', 'bag', 'ball',
  'bank', 'bar', 'base', 'bat', 'be', 'bear', 'beautiful', 'bed', 'before', 'begin',
  'behind', 'believe', 'bell', 'best', 'better', 'between', 'big', 'bird', 'black', 'block',
  'blood', 'blue', 'board', 'boat', 'body', 'bone', 'book', 'born', 'both', 'bottom', 'box',
  'boy', 'branch', 'bread', 'break', 'breakfast', 'bring', 'brother', 'brown', 'build',
  'burn', 'bus', 'busy', 'but', 'buy', 'by', 'call', 'camp', 'can', 'cap', 'car', 'card',
  'care', 'carry', 'case', 'cat', 'catch', 'cause', 'center', 'chair', 'chance', 'change',
  'hello', 'good', 'morning', 'afternoon', 'night', 'yes', 'no', 'please', 'thank'
]);

function runAudit() {
  const misplacedWords: any[] = [];
  const missingIpaWords: any[] = [];
  const duplicates = new Map<string, string[]>();
  let totalWords = 0;

  for (const level of levels) {
    const lessonsDir = path.join(contentPath, level, 'lessons');
    if (!fs.existsSync(lessonsDir)) continue;

    const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));

    for (const file of lessonFiles) {
      const filePath = path.join(lessonsDir, file);
      const lessonData: Lesson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      if (lessonData.words) {
        for (const word of lessonData.words) {
          totalWords++;
          const w = word.en.toLowerCase().trim();

          // Check for missing IPA
          if (!word.ipa && !word.pronunciation) {
            missingIpaWords.push({ id: word.id, en: word.en, level, lesson: lessonData.id });
          }

          // Check for misplaced words (basic word in advanced level)
          if ((level === 'b2' || level === 'c1') && basicWords.has(w)) {
            misplacedWords.push({ id: word.id, en: word.en, level, lesson: lessonData.id });
          }

          // Check for duplicates
          if (duplicates.has(w)) {
            duplicates.get(w)!.push(`${level} -> ${lessonData.id}`);
          } else {
            duplicates.set(w, [`${level} -> ${lessonData.id}`]);
          }
        }
      }
    }
  }

  const realDuplicates = Array.from(duplicates.entries())
    .filter(([_, locations]) => locations.length > 1)
    .map(([w, locs]) => ({ word: w, locations: locs }));

  const reviewQueue = {
    misplaced: misplacedWords,
    missingIpaCount: missingIpaWords.length,
    duplicates: realDuplicates
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'src', 'data', 'review-queue.json'),
    JSON.stringify(reviewQueue, null, 2)
  );

  const report = `# CEFR Educational Data Audit

## Summary
- **Total Words Audited**: ${totalWords}
- **Words Missing IPA**: ${missingIpaWords.length}
- **Misplaced Words**: ${misplacedWords.length}
- **Duplicate Words**: ${realDuplicates.length}

## 1. Misplaced Words (Basic words in B2/C1)
${misplacedWords.map(w => `- **${w.en}** (found in ${w.level}: ${w.lesson})`).join('\n')}

## 2. Duplicate Words
${realDuplicates.slice(0, 100).map(d => `- **${d.word}** (${d.locations.join(', ')})`).join('\n')}
${realDuplicates.length > 100 ? `*... and ${realDuplicates.length - 100} more.*` : ''}

> [!NOTE]
> Detailed review queue has been written to \`src/data/review-queue.json\`. Please use it to carefully remove or replace words safely.
`;

  fs.writeFileSync(
    path.join(process.cwd(), 'level-audit-report.md'),
    report
  );

  console.log(`Audit complete. Found ${misplacedWords.length} misplaced words and ${missingIpaWords.length} missing IPAs.`);
}

runAudit();
