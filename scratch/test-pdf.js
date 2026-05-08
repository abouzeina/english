const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

async function run() {
  const dataBuffer = fs.readFileSync(path.join(process.cwd(), 'data/oxford/oxford-5000.pdf'));
  const data = await pdfParse(dataBuffer);
  fs.writeFileSync('scratch/pdf-dump.txt', data.text);
  console.log("Dumped to scratch/pdf-dump.txt. Total characters:", data.text.length);
}

run().catch(console.error);
