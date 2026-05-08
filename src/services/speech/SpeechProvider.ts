export interface SpeechRecognitionOptions {
  lang?: string;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface SpeechProvider {
  startListening(options: SpeechRecognitionOptions): void;
  stopListening(): void;
  abortListening(): void;
  isSupported(): boolean;
}
