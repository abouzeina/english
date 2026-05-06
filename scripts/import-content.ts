import fs from 'fs';
import path from 'path';
import readline from 'readline';

/**
 * PRODUCTION-GRADE CONTENT PIPELINE v3
 * Linguistic Decision Engine with IPA-Word Matching
 */

// --- TYPES ---

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'critical';
type WordType = 'word' | 'phrase' | 'template';

interface Example {
  en: string;
  ar: string;
}

interface ParsedEntry {
  id: string;
  en: string;
  translation: string;
  ipa?: string;
  exampleCount: number;
  examples: Example[];
  type: WordType;
  confidence: ConfidenceLevel;
  decision: 'auto-accept' | 'manual-review' | 'critical-review';
  reasoning: string;
  levelId: string;
  lessonId: string;
  meta: {
    originalMatch: string;
    ipaCorrected: boolean;
  };
}

// --- CONFIG ---

const STOP_WORDS = new Set(['i', 'me', 'my', 'you', 'your', 'he', 'she', 'it', 'him', 'her', 'we', 'us', 'they', 'them', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'to', 'in', 'on']);

// --- UTILS ---

class PhoneticMatcher {
  /**
   * Simple heuristic to match IPA string with potential word candidates.
   * Focuses on consonant sounds and word starts.
   */
  static getSimilarity(word: string, ipa: string): number {
    const w = word.toLowerCase();
    const i = ipa.toLowerCase()
      .replace(/[ˈˌ.·]/g, '') // Remove stress marks
      .replace(/θ/g, 'th').replace(/ð/g, 'th').replace(/ʃ/g, 'sh').replace(/ʒ/g, 'zh').replace(/tʃ/g, 'ch').replace(/dʒ/g, 'j').replace(/ŋ/g, 'ng');

    // 1. Starts with same character?
    let score = 0;
    if (w[0] === i[0]) score += 0.4;
    
    // 2. Length similarity
    const lenDiff = Math.abs(w.length - i.length);
    score += Math.max(0, 0.3 - (lenDiff * 0.1));

    // 3. Character overlap (simple)
    let overlap = 0;
    const wChars = new Set(w);
    for (const char of i) if (wChars.has(char)) overlap++;
    score += (overlap / Math.max(w.length, i.length)) * 0.3;

    return Math.min(score, 1.0);
  }
}

class Normalizer {
  static cleanArabic(text: string): string { return text.replace(/[\u064B-\u0652]/g, "").replace(/\s+/g, " ").trim(); }
  static cleanEnglish(text: string): string { return text.replace(/\s+/g, " ").trim(); }
  static toSlug(text: string): string { return text.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }
}

// --- PARSER ENGINE ---

class LinguisticEngine {
  private words = new Map<string, ParsedEntry>();
  private currentLevel = 'lvl_a1';
  private currentLetter = '';
  
  private lastEnLine: string | null = null;
  private lastIPA: string | null = null;

  async parse(limitLines: number = Infinity) {
    const fileStream = fs.createReadStream(path.join(process.cwd(), 'data/raw/a1.txt'));
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let count = 0;
    for await (const line of rl) {
      if (++count > limitLines) break;
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.includes('كلمات المستوى')) continue;
      if (trimmed.includes('تبدأ بحرف')) {
        const m = trimmed.match(/\( ([A-Z]) \)/);
        if (m) this.currentLetter = m[1].toLowerCase();
        continue;
      }

      const isAr = /[\u0600-\u06FF]/.test(trimmed);
      if (isAr) this.handleArabic(trimmed);
      else this.handleEnglish(trimmed);
    }
    return Array.from(this.words.values());
  }

  private handleEnglish(line: string) {
    let ipa: string | undefined;
    const m = line.match(/\/([^\/]+)\//);
    if (m) {
      ipa = m[1].trim();
      line = line.replace(/\/[^\/]+\//, '').trim();
    }
    this.lastEnLine = Normalizer.cleanEnglish(line);
    this.lastIPA = ipa || null;
  }

  private handleArabic(line: string) {
    if (!this.lastEnLine) return;

    // 1. STAGE 1: Explicit Extraction
    let targetWord = '';
    let stage = 'explicit';
    const markerMatch = this.lastEnLine.match(/: ([^:]+) :/);
    if (markerMatch) {
      targetWord = markerMatch[1].trim();
    }

    // 2. STAGE 2 & 3: Contextual & Phonetic Correction
    const candidates = this.lastEnLine.replace(/:/g, '').split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
    let bestCandidate = '';
    let bestScore = 0;

    for (const cand of candidates) {
      if (!cand) continue;
      let score = 0;
      if (cand.toLowerCase().startsWith(this.currentLetter)) score += 0.5;
      if (this.lastIPA) {
        score += PhoneticMatcher.getSimilarity(cand, this.lastIPA);
      }
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = cand;
      }
    }

    let ipaCorrected = false;
    const originalMatch = targetWord;
    
    // Decision: Should we override targetWord with IPA best candidate?
    if (this.lastIPA && bestScore > 0.7 && bestCandidate.toLowerCase() !== targetWord.toLowerCase()) {
      targetWord = bestCandidate;
      ipaCorrected = true;
    } else if (!targetWord && bestCandidate) {
      targetWord = bestCandidate;
      stage = 'contextual';
    }

    if (!targetWord) return;

    // 3. STAGE 4: Confidence Scoring & Decision Engine
    const slug = Normalizer.toSlug(targetWord);
    const id = `w_a1_${slug}`;
    const cleanAr = Normalizer.cleanArabic(line);
    
    const wordCount = targetWord.split(' ').length;
    const stopwordCount = targetWord.toLowerCase().split(' ').filter(w => STOP_WORDS.has(w)).length;
    
    let confidence: ConfidenceLevel = 'medium';
    let decision: ParsedEntry['decision'] = 'manual-review';
    let reasoning = `Extracted via ${stage}.`;

    if (wordCount === 1 && this.lastIPA && bestScore > 0.8) {
      confidence = 'high';
      decision = 'auto-accept';
      reasoning = 'Strong phonetic match found.';
    }

    if (wordCount > 1 && (wordCount > 3 || stopwordCount > (wordCount / 2))) {
      confidence = 'critical';
      decision = 'critical-review';
      reasoning = 'Identified as a sentence template/phrase with high stopword density.';
    }

    const existing = this.words.get(id);
    if (existing) {
      existing.examples.push({ en: this.lastEnLine.replace(/:/g, ''), ar: cleanAr });
      existing.exampleCount++;
    } else {
      this.words.set(id, {
        id, en: targetWord, translation: '', ipa: this.lastIPA || undefined,
        exampleCount: 1, examples: [{ en: this.lastEnLine.replace(/:/g, ''), ar: cleanAr }],
        type: wordCount > 1 ? (confidence === 'critical' ? 'template' : 'phrase') : 'word',
        confidence, decision, reasoning,
        levelId: this.currentLevel, lessonId: `lsn_a1_${this.currentLetter}`,
        meta: { originalMatch, ipaCorrected }
      });
    }

    this.lastEnLine = null;
    this.lastIPA = null;
  }
}

// --- EXECUTION ---

async function run() {
  const limit = parseInt(process.argv[2]) || 500;
  console.log(`🚀 Linguistic Engine v3 | Processing ${limit} lines...\n`);
  
  const engine = new LinguisticEngine();
  const data = await engine.parse(limit);

  const stats = {
    total: data.length,
    auto: data.filter(d => d.decision === 'auto-accept').length,
    manual: data.filter(d => d.decision === 'manual-review').length,
    critical: data.filter(d => d.decision === 'critical-review').length,
    corrected: data.filter(d => d.meta.ipaCorrected).length
  };

  // Save Reports
  fs.writeFileSync('scripts/auto-accepted.json', JSON.stringify(data.filter(d => d.decision === 'auto-accept'), null, 2));
  fs.writeFileSync('scripts/manual-review.json', JSON.stringify(data.filter(d => d.decision === 'manual-review'), null, 2));
  fs.writeFileSync('scripts/critical-review.json', JSON.stringify(data.filter(d => d.decision === 'critical-review'), null, 2));

  console.log(`--- STATISTICS ---`);
  console.log(`Total Words/Phrases: ${stats.total}`);
  console.log(`✅ Auto Accepted: ${stats.auto} (${((stats.auto/stats.total)*100).toFixed(1)}%)`);
  console.log(`📝 Manual Review: ${stats.manual}`);
  console.log(`⚠️ Critical Review: ${stats.critical}`);
  console.log(`✨ IPA Corrected: ${stats.corrected}`);

  if (stats.corrected > 0) {
    console.log(`\n--- IPA CORRECTION EXAMPLES ---`);
    data.filter(d => d.meta.ipaCorrected).slice(0, 3).forEach(d => {
      console.log(`Original: "${d.meta.originalMatch}" -> Corrected: "${d.en}" (IPA: ${d.ipa})`);
    });
  }

  console.log(`\nReports saved to scripts/ (auto-accepted.json, manual-review.json, critical-review.json)`);
}

run().catch(console.error);
