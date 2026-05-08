import fs from 'fs';
import path from 'path';

// Types
interface Word {
  id: string;
  lessonId: string;
  en: string;
  translation?: string;
  ar?: string;
  ipa?: string;
  pronunciation?: string;
}

interface Lesson {
  id: string;
  levelId: string;
  words?: Word[];
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CACHE_PATH = path.join(process.cwd(), 'src', 'data', 'ipa-cache.json');
const MISSING_REVIEW_PATH = path.join(process.cwd(), 'src', 'data', 'missing-ipa-review.json');
const REPORT_PATH = path.join(process.cwd(), 'ipa-backfill-report.md');
const CONTENT_PATH = path.join(process.cwd(), 'src', 'data', 'content');
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1'];

function loadJson(p: string, defaultVal: any = {}) {
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return defaultVal;
}

function saveJson(p: string, data: any) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

// Validation function
function isValidIpa(ipa: string): boolean {
  if (!ipa || ipa.length < 2) return false;
  // Ensure it has slashes
  if (!ipa.startsWith('/') || !ipa.endsWith('/')) return false;
  
  // Basic sanity check for malformed characters (very basic check)
  if (ipa.includes('undefined') || ipa.includes('null') || ipa.includes('<')) return false;
  return true;
}

function normalizeIpa(ipa: string): string {
  let normalized = ipa.trim();
  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  if (!normalized.endsWith('/')) normalized = normalized + '/';
  
  // Fix double slashes
  normalized = normalized.replace(/\/\//g, '/');
  return normalized;
}

async function fetchIpa(word: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data && data.length > 0 && data[0].phonetic) {
        return data[0].phonetic;
    }
    if (data && data.length > 0 && data[0].phonetics) {
        const ph = data[0].phonetics.find((p: any) => p.text);
        if (ph) return ph.text;
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function runBackfill() {
  const cache = loadJson(CACHE_PATH, {});
  const missingReview = loadJson(MISSING_REVIEW_PATH, []);
  
  let totalWordsChecked = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  let totalCached = 0;

  // Track updates for the report
  const updatedWords: string[] = [];

  for (const level of LEVELS) {
    const lessonsDir = path.join(CONTENT_PATH, level, 'lessons');
    if (!fs.existsSync(lessonsDir)) continue;

    const files = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));
    // Sort deterministically
    files.sort();

    for (const file of files) {
      const filePath = path.join(lessonsDir, file);
      const lessonData: Lesson = loadJson(filePath);
      
      if (!lessonData.words) continue;

      let lessonModified = false;

      // Sort words deterministically before processing/saving
      lessonData.words.sort((a, b) => a.id.localeCompare(b.id));

      for (const word of lessonData.words) {
        totalWordsChecked++;
        
        const w = word.en.trim().toLowerCase();
        
        // Skip if it already has valid IPA
        const currentIpa = word.ipa || word.pronunciation;
        if (currentIpa && isValidIpa(currentIpa)) {
          continue;
        }

        // Check Cache
        if (cache[w]) {
          if (isValidIpa(cache[w])) {
             word.ipa = normalizeIpa(cache[w]);
             delete word.pronunciation; // Normalize property name
             lessonModified = true;
             totalCached++;
          }
          continue;
        }

        // Rate-limited Fetch
        console.log(`Fetching IPA for: ${w}`);
        const fetched = await fetchIpa(w);
        await sleep(300); // 300ms delay to respect rate limits

        if (fetched && isValidIpa(normalizeIpa(fetched))) {
          const finalIpa = normalizeIpa(fetched);
          word.ipa = finalIpa;
          delete word.pronunciation;
          cache[w] = finalIpa;
          lessonModified = true;
          totalUpdated++;
          updatedWords.push(`${w} -> ${finalIpa}`);
        } else {
          totalFailed++;
          cache[w] = "FAILED"; // Remember failure to avoid re-fetching
          if (!missingReview.includes(w)) {
            missingReview.push(w);
          }
        }
      }

      if (lessonModified) {
        saveJson(filePath, lessonData);
      }
    }
  }

  // Save Cache and Review Queues
  saveJson(CACHE_PATH, cache);
  missingReview.sort(); // Deterministic output
  saveJson(MISSING_REVIEW_PATH, missingReview);

  // Generate Report
  const report = `# IPA Backfill Report

## Summary
- **Total Words Checked**: ${totalWordsChecked}
- **Successfully Fetched**: ${totalUpdated}
- **Retrieved from Cache**: ${totalCached}
- **Failed (Added to Review)**: ${totalFailed}

## Validation Rules Applied
1. Bounding slashes (\`/\`) enforced.
2. Null or undefined strings rejected.
3. Overwrite skipped if word already contained valid IPA.
4. Deterministic sorting enforced on write.

## Details
> [!NOTE]
> Words that failed have been added to \`src/data/missing-ipa-review.json\` for manual intervention.

### Sample Updates
${updatedWords.slice(0, 100).map(u => `- ${u}`).join('\n')}
${updatedWords.length > 100 ? `*... and ${updatedWords.length - 100} more.*` : ''}
`;

  fs.writeFileSync(REPORT_PATH, report);
  console.log('IPA Backfill complete. Report generated.');
}

runBackfill();
