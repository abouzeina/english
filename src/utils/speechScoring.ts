export type WordMatchStatus = 'correct' | 'incorrect' | 'missing' | 'extra';

export interface WordMatchResult {
  word: string;
  status: WordMatchStatus;
}

export interface SpeechScoreResult {
  accuracy: number; // 0 to 100
  details: WordMatchResult[];
  isPassing: boolean;
}

/**
 * Calculates the Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalizes a string by removing punctuation and converting to lowercase.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Checks if two words match exactly (case and punctuation are already ignored).
 */
function isMatch(target: string, spoken: string): boolean {
  return target === spoken;
}

/**
 * Evaluates spoken text against the target sentence using Dynamic Programming word alignment.
 */
export function evaluateSpeech(targetText: string, spokenText: string): SpeechScoreResult {
  const targetWords = normalizeText(targetText).split(' ').filter(Boolean);
  const spokenWords = normalizeText(spokenText).split(' ').filter(Boolean);

  if (targetWords.length === 0) return { accuracy: 0, details: [], isPassing: false };
  if (spokenWords.length === 0) return { accuracy: 0, details: targetWords.map(w => ({ word: w, status: 'missing' })), isPassing: false };

  // DP Matrix for word alignment (Levenshtein distance at word level)
  const d: number[][] = [];
  for (let i = 0; i <= targetWords.length; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= spokenWords.length; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= targetWords.length; i++) {
    for (let j = 1; j <= spokenWords.length; j++) {
      if (isMatch(targetWords[i - 1], spokenWords[j - 1])) {
        d[i][j] = d[i - 1][j - 1]; // Match
      } else {
        d[i][j] = Math.min(
          d[i - 1][j - 1] + 1, // Substitution
          d[i][j - 1] + 1,     // Insertion (Extra spoken word)
          d[i - 1][j] + 1      // Deletion (Missing target word)
        );
      }
    }
  }

  // Backtrack to find the optimal alignment
  const details: WordMatchResult[] = [];
  let i = targetWords.length;
  let j = spokenWords.length;
  let matchCount = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && isMatch(targetWords[i - 1], spokenWords[j - 1])) {
      details.unshift({ word: targetWords[i - 1], status: 'correct' });
      matchCount++;
      i--;
      j--;
    } else {
      // Find which operation was chosen
      const current = d[i][j];
      const sub = (i > 0 && j > 0) ? d[i - 1][j - 1] : Infinity;
      const ins = (j > 0) ? d[i][j - 1] : Infinity;
      const del = (i > 0) ? d[i - 1][j] : Infinity;

      if (sub <= Math.min(ins, del) && i > 0 && j > 0 && current === sub + 1) {
        // Substitution: target word was spoken incorrectly
        details.unshift({ word: targetWords[i - 1], status: 'incorrect' });
        i--;
        j--;
      } else if (del <= Math.min(sub, ins) && i > 0 && current === del + 1) {
        // Deletion: target word was missing
        details.unshift({ word: targetWords[i - 1], status: 'missing' });
        i--;
      } else if (ins <= Math.min(sub, del) && j > 0 && current === ins + 1) {
        // Insertion: extra word was spoken
        details.unshift({ word: spokenWords[j - 1], status: 'extra' });
        j--;
      }
    }
  }

  // Calculate percentage based on matched target words
  const accuracy = Math.round((matchCount / targetWords.length) * 100);

  return {
    accuracy: Math.min(100, Math.max(0, accuracy)),
    details,
    isPassing: accuracy >= 80
  };
}
