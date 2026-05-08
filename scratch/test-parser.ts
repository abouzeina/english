import fs from 'fs';

const dump = fs.readFileSync('scratch/pdf-dump.txt', 'utf8');
let lines = dump.split('\n').map(l => l.trim());

// 1. Remove page headers/footers
lines = lines.filter(l => !l.startsWith('© Oxford') && !l.startsWith('The Oxford'));

// 2. Fix wrapped lines
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
    'n\\.', 'v\\.', 'adj\\.', 'adv\\.', 'prep\\.', 'conj\\.', 'pron\\.', 'det\\.', 'exclam\\.', 'number', 'indefinite article', 'modal v\\.', 'phrasal verb'
];
const posRegex = new RegExp('\\s+(' + posIndicators.join('|') + ')(\\s|/|,)');

let entries: any[] = [];
let malformed: string[] = [];

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
            continue;
        }
    }

    rawWord = rawWord.replace(/\s*\(.*?\)\s*/g, '');
    rawWord = rawWord.replace(/\d+$/, '');
    let words = rawWord.split(',').map(w => w.trim());
    let levels = Array.from(restOfLine.matchAll(/\b(A1|A2|B1|B2|C1|C2)\b/g)).map(m => m[0]);

    if (levels.length === 0) {
        malformed.push(line);
        continue;
    }

    for (let w of words) {
        for (let l of new Set(levels)) {
            entries.push({ word: w, level: l });
        }
    }
}

fs.writeFileSync('scratch/test-parsed.json', JSON.stringify({
    total: entries.length,
    malformed: malformed,
    sample: entries.slice(0, 100)
}, null, 2));
console.log("Done");
