/**
 * Speech Recognition Service Abstraction
 * Preparation for Pronunciation Scoring
 */

export interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export type SpeechStatus = 'idle' | 'listening' | 'processing' | 'error' | 'denied';

class SpeechService {
  private recognition: any | null = null;
  private status: SpeechStatus = 'idle';

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }
    }
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      return false;
    }
  }

  public startListening(onResult: (result: SpeechResult) => void, onError: (error: string) => void) {
    if (!this.recognition) {
      onError('Speech recognition not supported in this browser.');
      return;
    }

    this.recognition.onstart = () => { this.status = 'listening'; };
    this.recognition.onend = () => { this.status = 'idle'; };
    this.recognition.onerror = (event: any) => { 
      this.status = 'error';
      onError(event.error); 
    };
    
    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      onResult({
        transcript: result[0].transcript,
        confidence: result[0].confidence,
        isFinal: result.isFinal
      });
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error(e);
    }
  }

  public stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  public getStatus(): SpeechStatus {
    return this.status;
  }

  /**
   * Placeholder for future AI scoring
   */
  public async scorePronunciation(expected: string, actual: string): Promise<number> {
    // Basic fuzzy matching for now
    const clean = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const e = clean(expected);
    const a = clean(actual);
    
    if (e === a) return 100;
    
    // Simple levenshtein or inclusion check for now
    if (e.includes(a) || a.includes(e)) return 70;
    
    return 0;
  }
}

export const speechService = new SpeechService();
