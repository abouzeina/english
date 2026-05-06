import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const wordsPath = path.join(process.cwd(), 'src/data/words.json');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log("\n✨ Create a New Word ✨\n");

  const en = await question("English Word: ");
  const ar = await question("Arabic Translation: ");
  const type = await question("Type (lesson / category) [lesson]: ");
  
  let lessonId = null;
  let categoryId = null;

  if (type === "category") {
    categoryId = await question("Category ID (e.g. cat_quran_1): ");
  } else {
    lessonId = await question("Lesson ID (e.g. lsn_1): ");
  }

  const exampleEn = await question("English Example (optional): ");
  const exampleAr = await question("Arabic Example (optional): ");

  // Generate unique ID based on timestamp
  const newId = `w_${Date.now()}`;

  const newWord = {
    id: newId,
    lessonId: lessonId || null,
    categoryId: categoryId || null,
    en,
    ar,
    ...(exampleEn && { exampleEn }),
    ...(exampleAr && { exampleAr }),
  };

  words.push(newWord);
  
  fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2), 'utf-8');
  
  console.log(`\n✅ Word '${en}' added successfully with ID: ${newId}!\n`);
  rl.close();
}

main().catch(console.error);
