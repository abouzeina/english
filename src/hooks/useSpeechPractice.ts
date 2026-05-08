import { useState, useCallback, useRef, useEffect } from 'react';
import { defaultSpeechProvider } from '@/services/speech/WebSpeechProvider';
import { SpeechProvider } from '@/services/speech/SpeechProvider';
import { evaluateSpeech, SpeechScoreResult } from '@/utils/speechScoring';

interface UseSpeechPracticeOptions {
  targetText: string;
  lang?: string;
  provider?: SpeechProvider;
}

export function useSpeechPractice({ 
  targetText, 
  lang = 'en-US', 
  provider = defaultSpeechProvider 
}: UseSpeechPracticeOptions) {
  const [isPreparing, setIsPreparing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<SpeechScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const clearTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const stopMediaRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!provider.isSupported()) {
      setError('not-supported');
      return;
    }

    setError(null);
    setTranscript('');
    setScore(null);
    setAudioUrl(null);
    setIsPreparing(true);
    clearTimeouts();

    let stream: MediaStream | null = null;

    try {
      // 1. Warm up the microphone and get the stream FIRST to avoid cutting off the first word
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        // Clean up tracks
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.warn("MediaRecorder failed, continuing without playback support:", err);
      // We continue even if MediaRecorder fails (e.g. some strict browsers)
    }

    // 2. Now start the Speech Recognition. The mic is already hot, so it should be instant.
    provider.startListening({
      lang,
      onStart: () => {
        setIsPreparing(false);
        setIsListening(true);
        // Fallback safety timeout if speech never ends (15 seconds max)
        timeoutRef.current = setTimeout(() => {
          provider.stopListening();
          stopMediaRecording();
        }, 15000);
      },
      onResult: (text, isFinal) => {
        setTranscript(text);
        
        // Reset timeout on new input
        clearTimeouts();
        
        if (isFinal) {
          const result = evaluateSpeech(targetText, text);
          setScore(result);
          provider.stopListening();
          stopMediaRecording();
        } else {
          // Increase silence timeout to 5 seconds to avoid cutting off long sentences
          timeoutRef.current = setTimeout(() => {
            provider.stopListening();
            stopMediaRecording();
          }, 5000);
        }
      },
      onError: (err) => {
        setError(err);
        setIsPreparing(false);
        setIsListening(false);
        clearTimeouts();
        stopMediaRecording();
      },
      onEnd: () => {
        setIsPreparing(false);
        setIsListening(false);
        clearTimeouts();
        stopMediaRecording();
        // If we ended without a final result but we have a transcript, evaluate it
        setTranscript((currentTranscript) => {
          if (currentTranscript && !score) {
            setScore(evaluateSpeech(targetText, currentTranscript));
          }
          return currentTranscript;
        });
      }
    });
  }, [provider, lang, targetText, score, stopMediaRecording]);

  const stopListening = useCallback(() => {
    provider.stopListening();
    stopMediaRecording();
    setIsPreparing(false);
    setIsListening(false);
    clearTimeouts();
  }, [provider, stopMediaRecording]);

  const reset = useCallback(() => {
    stopListening();
    setTranscript('');
    setScore(null);
    setError(null);
    setAudioUrl(null);
  }, [stopListening]);

  useEffect(() => {
    return () => {
      clearTimeouts();
      provider.abortListening();
      stopMediaRecording();
    };
  }, [provider, stopMediaRecording]);

  return {
    isPreparing,
    isListening,
    transcript,
    score,
    error,
    audioUrl,
    isSupported: provider.isSupported(),
    startListening,
    stopListening,
    reset
  };
}
