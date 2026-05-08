import { SpeechProvider, SpeechRecognitionOptions } from './SpeechProvider';

export class WebSpeechProvider implements SpeechProvider {
  private recognition: any | null = null;
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  startListening(options: SpeechRecognitionOptions): void {
    if (!this.isSupported()) {
      options.onError('not-supported');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.lang = options.lang || 'en-US';
    this.recognition.continuous = true; // MUST be true so the browser doesn't abruptly stop when the user breathes
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (options.onStart) options.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let transcript = '';

      // Iterate through ALL results from the beginning of the continuous session
      for (let i = 0; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }

      // We always pass false for isFinal to prevent the UI from auto-stopping 
      // based on the browser's arbitrary utterance chunking.
      // The UI will stop when the user clicks the stop button or the 5-second silence timeout hits.
      options.onResult(transcript, false);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      // Handle special errors like 'not-allowed' for missing permissions
      options.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (options.onEnd) options.onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      options.onError('start-failed');
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  abortListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }
}

export const defaultSpeechProvider = new WebSpeechProvider();
