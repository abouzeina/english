import fs from 'fs';
import path from 'path';

const MISSING_WORDS_FILE = path.join(process.cwd(), 'missing-words-by-level.json');
const GENERATED_DIR = path.join(process.cwd(), 'scripts', 'gap-recovery', 'generated');
const FAILED_DIR = path.join(process.cwd(), 'scripts', 'gap-recovery', 'failed-generation-batches');
const REPORT_FILE = path.join(process.cwd(), 'generation-report.md');

function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const lines = fs.readFileSync(envPath, 'utf8').split('\n');
            for (const line of lines) {
                if (line.trim() && !line.startsWith('#')) {
                    const [key, ...rest] = line.split('=');
                    if (key && rest.length > 0) {
                        process.env[key.trim()] = rest.join('=').trim();
                    }
                }
            }
        }
    } catch(e) {}
}

const SYSTEM_PROMPT = `You are an expert English-Arabic linguist and curriculum designer. 
You are generating a high-quality educational dataset for an Oxford-aligned app (like Duolingo/Memrise).
You must output ONLY valid JSON.

For the given list of English words, provide a JSON object with a "words" array containing the structures:
{
  "words": [
    {
      "en": "word",
      "translation": "Natural Arabic translation (not literal/robotic, common meaning suitable for the CEFR level)",
      "ipa": "Validated IPA with slashes (e.g. /wɜːd/)",
      "type": "word or phrase",
      "examples": [
        {
          "en": "Short, natural, grammatically correct example suitable for flashcards.",
          "ar": "Natural, non-Google-translate style Arabic translation."
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. ONLY output the JSON object, no markdown wrappers, no explanations.
2. TRANSLATION QUALITY: Provide natural Arabic educational phrasing. Do not use literal translations.
3. ANTI-AI DETECTION: Avoid generic AI sentence patterns (e.g., "This is very important", "He was happy to...", "She likes to..."). Examples must be human-like, educational, and reflect the real-world usage of the word.
4. EXAMPLES: Must be short, natural, grammatically perfect, and suitable for flashcards.
5. IPA: Must be accurate standard British or American IPA, enclosed in slashes.`;

function appendReport(batchId: string, level: string, wordsCount: number, tokens: number, retries: number, status: string) {
    const time = new Date().toISOString();
    const line = `| ${time} | ${batchId} | ${level} | ${wordsCount} | ${tokens} | ${retries} | ${status} |\n`;
    if (!fs.existsSync(REPORT_FILE)) {
        fs.writeFileSync(REPORT_FILE, '# Generation Report\n\n| Timestamp | Batch ID | Level | Words | Tokens Used | Retries | Status |\n|---|---|---|---|---|---|---|\n');
    }
    fs.appendFileSync(REPORT_FILE, line);
}

async function run() {
    loadEnv();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("Missing OPENAI_API_KEY in .env.local");
        process.exit(1);
    }

    if (!fs.existsSync(MISSING_WORDS_FILE)) {
        console.error("Missing words file not found!");
        return;
    }

    if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });
    if (!fs.existsSync(FAILED_DIR)) fs.mkdirSync(FAILED_DIR, { recursive: true });

    const missingData = JSON.parse(fs.readFileSync(MISSING_WORDS_FILE, 'utf-8'));
    const levelToProcess = process.argv[2] || 'B1';
    const batchSize = parseInt(process.argv[3] || '25'); // Lower batch size for stability

    let words: string[] = missingData[levelToProcess];
    if (!words || words.length === 0) {
        console.log("No missing words for level " + levelToProcess);
        return;
    }

    const generatedFiles = fs.readdirSync(GENERATED_DIR).filter(f => f.startsWith(levelToProcess.toLowerCase() + '-batch'));
    const generatedWords = new Set<string>();
    for (const f of generatedFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(GENERATED_DIR, f), 'utf-8'));
            for (const item of data) {
                generatedWords.add(item.en.toLowerCase());
            }
        } catch(e) {}
    }

    const wordsToProcess = words.filter(w => !generatedWords.has(w.toLowerCase())).slice(0, batchSize);

    if (wordsToProcess.length === 0) {
        console.log("All words for " + levelToProcess + " have been generated!");
        return;
    }

    console.log("Generating batch of " + wordsToProcess.length + " words for level " + levelToProcess);

    const userPrompt = "Level: " + levelToProcess + "\nWords to process:\n" + wordsToProcess.join('\n');
    const batchId = Date.now().toString();

    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    let tokenUsage = 0;

    while (attempts < maxAttempts && !success) {
        attempts++;
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.3,
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                throw new Error("API Error: " + response.statusText);
            }

            const data = await response.json();
            tokenUsage = data.usage?.total_tokens || 0;
            const content = data.choices[0].message.content;
            
            let parsed;
            try {
                parsed = JSON.parse(content);
                if (parsed.words) parsed = parsed.words;
                else if (parsed.data) parsed = parsed.data;
                else if (!Array.isArray(parsed)) {
                    const keys = Object.keys(parsed);
                    for (const key of keys) {
                        if (Array.isArray(parsed[key])) {
                            parsed = parsed[key];
                            break;
                        }
                    }
                }
                
                if (!Array.isArray(parsed)) throw new Error("Parsed content is not an array");

                const outFile = path.join(GENERATED_DIR, levelToProcess.toLowerCase() + '-batch-' + batchId + '.json');
                fs.writeFileSync(outFile, JSON.stringify(parsed, null, 2));
                console.log("Saved batch to " + outFile);
                appendReport(batchId, levelToProcess, wordsToProcess.length, tokenUsage, attempts, "SUCCESS");
                success = true;

            } catch (parseError) {
                console.error("Strict JSON parse failed, moving to failed-generation-batches...");
                const failedFile = path.join(FAILED_DIR, levelToProcess.toLowerCase() + '-failed-' + batchId + '-attempt' + attempts + '.txt');
                fs.writeFileSync(failedFile, content);
                throw new Error("JSON Parse Error");
            }

        } catch (e: any) {
            console.error("Attempt " + attempts + " failed:", e.message);
            if (attempts < maxAttempts) {
                const backoff = Math.pow(2, attempts) * 1000;
                console.log("Waiting " + backoff + "ms before retry...");
                await new Promise(r => setTimeout(r, backoff));
            } else {
                appendReport(batchId, levelToProcess, wordsToProcess.length, tokenUsage, attempts, "FAILED");
                console.error("Max retries reached. Batch failed.");
            }
        }
    }
}

run().catch(console.error);
