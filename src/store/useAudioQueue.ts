import { create } from 'zustand';

// Interface for swappable Audio Backend (ElevenLabs, Azure, WebSpeech)
export interface AudioBackend {
  play: (text: string, options?: AudioOptions) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

interface AudioOptions {
  speed?: number;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}

// Default Backend: Web Speech API
class WebSpeechBackend implements AudioBackend {
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  async play(text: string, options?: AudioOptions): Promise<void> {
    if (!this.synth) return Promise.resolve();

    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech to prevent overlap
      this.synth!.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = options?.speed || 1;
      
      utterance.onend = () => {
        if (options?.onEnd) options.onEnd();
        resolve();
      };
      
      utterance.onerror = (e) => {
        // Ignore abort errors caused by synth.cancel()
        if (e.error !== 'canceled') {
          if (options?.onError) options.onError(new Error(e.error));
          reject(e);
        } else {
          resolve();
        }
      };

      this.currentUtterance = utterance;
      this.synth!.speak(utterance);
    });
  }

  stop() {
    if (this.synth) this.synth.cancel();
    this.currentUtterance = null;
  }

  pause() {
    if (this.synth && this.synth.speaking) this.synth.pause();
  }

  resume() {
    if (this.synth && this.synth.paused) this.synth.resume();
  }
}

interface AudioQueueItem {
  id: string;
  text: string;
  speed?: number;
}

interface AudioQueueState {
  queue: AudioQueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  backend: AudioBackend;
  
  // Actions
  playItem: (item: AudioQueueItem) => Promise<void>;
  playQueue: (items: AudioQueueItem[]) => void;
  stopAll: () => void;
  pauseQueue: () => void;
  resumeQueue: () => void;
  next: () => void;
  prev: () => void;
  _processQueue: () => Promise<void>;
}

export const useAudioQueue = create<AudioQueueState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  backend: new WebSpeechBackend(), // Can easily be swapped later

  playItem: async (item) => {
    const { backend } = get();
    set({ isPlaying: true });
    backend.stop(); // Stop anything playing immediately to prevent overlap
    
    await backend.play(item.text, {
      speed: item.speed,
      onEnd: () => set({ isPlaying: false })
    });
  },

  playQueue: (items) => {
    get().backend.stop(); // Stop any currently playing audio
    set({ queue: items, currentIndex: 0, isPlaying: true });
    get()._processQueue();
  },

  stopAll: () => {
    get().backend.stop();
    set({ queue: [], currentIndex: -1, isPlaying: false });
  },

  pauseQueue: () => {
    get().backend.pause();
    set({ isPlaying: false });
  },

  resumeQueue: () => {
    get().backend.resume();
    set({ isPlaying: true });
  },

  next: () => {
    const state = get();
    if (state.currentIndex < state.queue.length - 1) {
      set({ currentIndex: state.currentIndex + 1 });
      get()._processQueue();
    } else {
      get().stopAll();
    }
  },

  prev: () => {
    const state = get();
    if (state.currentIndex > 0) {
      set({ currentIndex: state.currentIndex - 1 });
      get()._processQueue();
    }
  },

  _processQueue: async () => {
    const state = get();
    if (state.currentIndex < 0 || state.currentIndex >= state.queue.length) {
      set({ isPlaying: false });
      return;
    }

    const currentItem = state.queue[state.currentIndex];
    await state.backend.play(currentItem.text, {
      speed: currentItem.speed,
      onEnd: () => {
        // Auto-advance logic
        const latestState = get();
        if (latestState.isPlaying && latestState.currentIndex === state.currentIndex) {
          latestState.next();
        }
      }
    });
  }
}));
