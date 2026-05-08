import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

const DATA_DIR = path.join(process.cwd(), 'src/data/content');
const OXFORD_PDF = path.join(process.cwd(), 'data/oxford/oxford-5000.pdf');
const REPORT_DIR = process.cwd();

// Normalize text for comparison
function normalizeStr(str: string): string {
    return str.toLowerCase()
        .replace(/['’‘]/g, "'") // normalize apostrophes
        .replace(/["“”]/g, '"') // normalize quotes
        .replace(/-/g, ' ') // replace hyphens with spaces
        .replace(/\s+/g, ' ') // remove duplicate spaces
        .trim();
}

// Map British to American or vice versa to prevent false mismatches
const variantMap: Record<string, string> = {
    "colour": "color",
    "organise": "organize",
    "travelling": "traveling",
    "favourite": "favorite",
    "theatre": "theater",
    "centre": "center",
    "metre": "meter",
    "realise": "realize",
    "recognise": "recognize",
    "behaviour": "behavior",
    "analyse": "analyze",
    "apologise": "apologize",
    "defence": "defense",
    "licence": "license",
    "offence": "offense",
    "practise": "practice", // practice is both in US
    "programme": "program",
    "catalogue": "catalog",
    "dialogue": "dialog",
    "jewellery": "jewelry",
    "grey": "gray"
};

function applyVariants(str: string): string[] {
    const tokens = str.split(' ');
    const variants: string[] = [str];
    
    // Check if whole phrase is a variant
    if (variantMap[str]) variants.push(variantMap[str]);
    for (const [uk, us] of Object.entries(variantMap)) {
        if (us === str) variants.push(uk);
    }

    // Also check token by token for simple replacements
    const replacedTokens = tokens.map(t => variantMap[t] || t);
    const replacedStr = replacedTokens.join(' ');
    if (replacedStr !== str) variants.push(replacedStr);

    return Array.from(new Set(variants));
}

async function parseOxfordPDF() {
    console.log("Parsing Oxford 5000 PDF...");
    const dataBuffer = fs.readFileSync(OXFORD_PDF);
    const data = await pdfParse(dataBuffer);
    
    let lines = data.text.split('\n').map(l => l.trim());
    lines = lines.filter(l => !l.startsWith('© Oxford') && !l.startsWith('The Oxford'));

    let joinedLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === '') continue;
        let line = lines[i];
        if (!/(A1|A2|B1|B2|C1|C2)/.test(line)) {
            if (i + 1 < lines.length && /(A1|A2|B1|B2|C1|C2)/.test(lines[i + 1])) {
                line += ' ' + lines[i + 1];
                i++;
            }
        }
        joinedLines.push(line);
    }

    const posIndicators = [
        'n\\.', 'v\\.', 'adj\\.', 'adv\\.', 'prep\\.', 'conj\\.', 'pron\\.', 'det\\.', 'exclam\\.', 'number', 'indefinite article', 'modal v\\.', 'phrasal verb', 'auxiliary v\\.'
    ];
    // Look ahead for space, comma, slash, end of string, or capital letter (level)
    const posRegex = new RegExp('\\s+(' + posIndicators.join('|') + ')(?=\\s|,|/|[A-Z]|$)');

    let entries: {word: string, level: string, raw: string}[] = [];
    let malformed: string[] = [];
    let skipped = 0;
    
    for (let line of joinedLines) {
        line = line.replace(/\s+/g, ' ').trim();
        if (!line) continue;

        let match = line.match(posRegex);
        let rawWord = '';
        let restOfLine = '';

        if (match) {
            rawWord = line.substring(0, match.index).trim();
            restOfLine = line.substring(match.index!);
        } else {
            let levelMatch = line.match(/\b(A1|A2|B1|B2|C1|C2)\b/);
            if (levelMatch) {
                rawWord = line.substring(0, levelMatch.index).trim();
                restOfLine = line.substring(levelMatch.index!);
            } else {
                malformed.push(line);
                skipped++;
                continue;
            }
        }

        // Clean up word
        rawWord = rawWord.replace(/\s*\(.*?\)\s*/g, ''); // remove parenthetical context
        rawWord = rawWord.replace(/\d+$/, ''); // remove trailing numbers used for homographs
        
        let words = rawWord.split(',').map(w => w.trim()).filter(w => w.length > 0);
        let levels = Array.from(restOfLine.matchAll(/\b(A1|A2|B1|B2|C1|C2)\b/g)).map(m => m[0]);

        if (levels.length === 0) {
            malformed.push(line);
            skipped++;
            continue;
        }

        for (let w of words) {
            for (let l of new Set(levels)) {
                entries.push({ word: w, level: l, raw: line });
            }
        }
    }
    
    return { entries, malformed, skipped, totalLines: joinedLines.length };
}

function loadAppData() {
    console.log("Loading App Data...");
    const levels = ['a1', 'a2', 'b1', 'b2', 'c1'];
    let appWords: {word: string, level: string, lesson: string}[] = [];

    for (const level of levels) {
        const lessonsDir = path.join(DATA_DIR, level, 'lessons');
        if (!fs.existsSync(lessonsDir)) continue;
        
        const files = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const content = fs.readFileSync(path.join(lessonsDir, file), 'utf8');
            try {
                const json = JSON.parse(content);
                if (json.words && Array.isArray(json.words)) {
                    for (const w of json.words) {
                        if (w.en && w.type === 'word' || w.type === 'phrase' || w.type === 'expression') { // Ensure we pick phrases too
                             // use w.difficulty if available, else derive from folder
                             let wl = w.difficulty ? w.difficulty.toUpperCase() : level.toUpperCase();
                             appWords.push({ word: w.en, level: wl, lesson: file });
                        }
                    }
                }
            } catch (e) {
                console.error(`Failed to parse ${file}`, e);
            }
        }
    }
    return appWords;
}

async function runAudit() {
    const { entries: oxfordEntries, malformed, skipped, totalLines } = await parseOxfordPDF();
    
    // Deduplicate Oxford entries (keep lowest level if word appears multiple times)
    const oxfordMap = new Map<string, string>(); // normalized -> level
    const oxfordOriginals = new Map<string, string>(); // normalized -> original word
    
    for (const entry of oxfordEntries) {
        const norm = normalizeStr(entry.word);
        if (!oxfordMap.has(norm)) {
            oxfordMap.set(norm, entry.level);
            oxfordOriginals.set(norm, entry.word);
        } else {
            // If already exists, keep the lower level (e.g. A1 < B1)
            const currentLevel = oxfordMap.get(norm)!;
            if (entry.level < currentLevel) {
                oxfordMap.set(norm, entry.level);
                oxfordOriginals.set(norm, entry.word);
            }
        }
    }
    
    // Create official JSON
    const officialOutput = Array.from(oxfordMap.entries())
        .map(([norm, lvl]) => ({ word: oxfordOriginals.get(norm)!, level: lvl }))
        .sort((a, b) => a.word.localeCompare(b.word));
        
    fs.writeFileSync(path.join(REPORT_DIR, 'official-oxford-5000.json'), JSON.stringify(officialOutput, null, 2));

    // Validation Report
    const validationReport = [
        '# Oxford 5000 Validation Report',
        '',
        '## Parsing Confidence',
        '- Total Lines Processed: ' + totalLines,
        '- Valid Entries Extracted: ' + oxfordEntries.length,
        '- Deduplicated Unique Words: ' + oxfordMap.size,
        '- Malformed/Skipped Lines: ' + skipped,
        '- Parser Confidence: ' + ((totalLines - skipped) / totalLines * 100).toFixed(2) + '%',
        '',
        '## Suspicious/Malformed Lines',
        malformed.length > 0 ? malformed.slice(0, 50).map(m => "- " + m).join("\n") : "None detected.",
        '',
        '## Sample Extracted Entries',
        '```json',
        JSON.stringify(officialOutput.slice(0, 20), null, 2),
        '```',
        ''
    ].join('\n');
    fs.writeFileSync(path.join(REPORT_DIR, 'oxford-validation-report.md'), validationReport);

    // App Data Alignment
    const appWords = loadAppData();
    
    const missingByLevel: Record<string, string[]> = { A1: [], A2: [], B1: [], B2: [], C1: [], C2: [] };
    const misplacedWords: {word: string, appLevel: string, oxfordLevel: string}[] = [];
    const extraWords: {word: string, level: string, category: string}[] = [];
    const duplicateWords: {word: string, count: number, levels: string[]}[] = [];
    
    // Check for duplicates in app
    const appWordCounts = new Map<string, {count: number, levels: Set<string>}>();
    const appWordNormMap = new Map<string, string>(); // norm -> original
    
    for (const app of appWords) {
        const norm = normalizeStr(app.word);
        appWordNormMap.set(norm, app.word);
        if (!appWordCounts.has(norm)) {
            appWordCounts.set(norm, {count: 0, levels: new Set()});
        }
        const data = appWordCounts.get(norm)!;
        data.count++;
        data.levels.add(app.level);
    }
    
    for (const [norm, data] of appWordCounts.entries()) {
        if (data.count > 1) {
            duplicateWords.push({
                word: appWordNormMap.get(norm)!,
                count: data.count,
                levels: Array.from(data.levels)
            });
        }
    }
    
    // Check Missing Words
    let exactMatchesCount = 0;
    for (const [norm, oxLevel] of oxfordMap.entries()) {
        const variants = applyVariants(norm);
        let foundInApp = false;
        let appLevel = '';
        
        for (const v of variants) {
            if (appWordCounts.has(v)) {
                foundInApp = true;
                appLevel = Array.from(appWordCounts.get(v)!.levels)[0]; // take first
                break;
            }
        }
        
        if (!foundInApp) {
            missingByLevel[oxLevel].push(oxfordOriginals.get(norm)!);
        } else {
            exactMatchesCount++;
            if (appLevel !== oxLevel) {
                misplacedWords.push({
                    word: oxfordOriginals.get(norm)!,
                    appLevel,
                    oxfordLevel: oxLevel
                });
            }
        }
    }
    
    // Sort missing words
    for (const lvl in missingByLevel) {
        missingByLevel[lvl].sort((a, b) => a.localeCompare(b));
    }
    
    // Check Extra Words
    for (const [norm, data] of appWordCounts.entries()) {
        let foundInOxford = false;
        const variants = applyVariants(norm);
        for (const v of variants) {
            if (oxfordMap.has(v)) {
                foundInOxford = true;
                break;
            }
        }
        
        if (!foundInOxford) {
            const original = appWordNormMap.get(norm)!;
            const category = original.includes(' ') ? 'conversational/expression' : 'supplemental/teacher-added';
            extraWords.push({
                word: original,
                level: Array.from(data.levels)[0],
                category
            });
        }
    }
    
    // Coverage
    const coverage: Record<string, {total: number, found: number, percentage: string}> = {};
    for (const lvl of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
        const totalInLevel = Array.from(oxfordMap.values()).filter(l => l === lvl).length;
        const missingInLevel = missingByLevel[lvl].length;
        const found = totalInLevel - missingInLevel;
        coverage[lvl] = {
            total: totalInLevel,
            found: found,
            percentage: totalInLevel > 0 ? ((found / totalInLevel) * 100).toFixed(0) + '%' : 'N/A'
        };
    }
    
    // Generate Reports
    fs.writeFileSync(path.join(REPORT_DIR, 'missing-words-by-level.json'), JSON.stringify(missingByLevel, null, 2));
    fs.writeFileSync(path.join(REPORT_DIR, 'misplaced-words.json'), JSON.stringify(misplacedWords, null, 2));
    fs.writeFileSync(path.join(REPORT_DIR, 'duplicate-words.json'), JSON.stringify(duplicateWords, null, 2));
    fs.writeFileSync(path.join(REPORT_DIR, 'extra-words.json'), JSON.stringify(extraWords, null, 2));
    
    let missingDetailed = '# Missing Words Detailed Report\n\n';
    for (const lvl of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
        if (!coverage[lvl] || coverage[lvl].total === 0) continue;
        missingDetailed += '## ' + lvl + '\n';
        missingDetailed += '- **Coverage**: ' + coverage[lvl].percentage + '\n';
        missingDetailed += '- **Missing Count**: ' + missingByLevel[lvl].length + '\n\n';
        missingDetailed += '### Words:\n';
        const words = missingByLevel[lvl];
        for (const w of words) {
             const type = w.includes(' ') ? 'phrasal verb/expression' : 'single word';
             missingDetailed += '- ' + w + ' (' + type + ')\n';
        }
        missingDetailed += '\n';
    }
    fs.writeFileSync(path.join(REPORT_DIR, 'missing-words-detailed.md'), missingDetailed);
    
    const alignmentReport = [
        '# Oxford Alignment Audit Report',
        '',
        '## 1. Overview',
        '- **Oxford 5000 Total Words**: ' + oxfordMap.size,
        '- **App Total Unique Words**: ' + appWordCounts.size,
        '- **Exact Matches Count**: ' + exactMatchesCount,
        '- **Total Missing**: ' + Object.values(missingByLevel).reduce((acc, val) => acc + val.length, 0),
        '- **Total Extra (Supplemental)**: ' + extraWords.length,
        '- **Total Misplaced (Level Mismatch)**: ' + misplacedWords.length,
        '- **Total Duplicates (In App)**: ' + duplicateWords.length,
        '',
        '## 2. Coverage By Level',
        ['A1', 'A2', 'B1', 'B2', 'C1'].map(l => "- **" + l + "**: " + coverage[l].percentage + " (" + coverage[l].found + "/" + coverage[l].total + ")").join('\n'),
        '',
        '## 3. Categories of Findings',
        '',
        '### 3.1 Extra Words (Supplemental)',
        'Extra words are not strictly errors. They may be conversational additions, idioms, or teacher-added vocabulary.',
        'See `extra-words.json` for the full list of ' + extraWords.length + ' words.',
        '',
        '### 3.2 Misplaced Words',
        'Words that exist in both datasets but are assigned to different CEFR levels.',
        'See `misplaced-words.json` for the full list of ' + misplacedWords.length + ' words.',
        '',
        '### 3.3 Duplicate Words',
        'Words that appear multiple times in the app dataset.',
        'See `duplicate-words.json` for the full list of ' + duplicateWords.length + ' words.'
    ].join('\n');
    fs.writeFileSync(path.join(REPORT_DIR, 'oxford-alignment-report.md'), alignmentReport);

    console.log("Audit complete! Reports generated.");
}

runAudit().catch(console.error);
