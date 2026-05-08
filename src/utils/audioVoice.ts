let cachedVoice: SpeechSynthesisVoice | null = null;
let hasInitialized = false;

export function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  
  if (hasInitialized && cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  hasInitialized = true;

  // 1. Explicitly preferred ultra-high-quality voices
  const preferredNames = [
    'Google US English', 
    'Google UK English Male',
    'Google UK English Female',
    'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Guy Online (Natural) - English (United States)',
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Samantha',
    'Daniel'
  ];

  for (const name of preferredNames) {
    const voice = voices.find(v => v.name === name);
    if (voice) {
      cachedVoice = voice;
      return voice;
    }
  }

  // 2. Fallback to any online/natural voice
  const naturalVoice = voices.find(v => 
    v.lang.startsWith('en-') && 
    (v.name.includes('Online') || v.name.includes('Natural') || v.name.includes('Google'))
  );
  if (naturalVoice) {
    cachedVoice = naturalVoice;
    return naturalVoice;
  }

  // 3. Fallback to any English voice
  const englishVoice = voices.find(v => v.lang.startsWith('en-'));
  if (englishVoice) {
    cachedVoice = englishVoice;
    return englishVoice;
  }

  // 4. Fallback to first available
  cachedVoice = voices[0] || null;
  return cachedVoice;
}
