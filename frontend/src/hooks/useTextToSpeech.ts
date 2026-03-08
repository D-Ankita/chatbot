import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  isSupported: boolean;
}

// Global tracker so only one bubble shows "speaking" at a time
let activeSpeakerId: number | null = null;
let nextSpeakerId = 0;

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const idRef = useRef(nextSpeakerId++);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Sync local state when another instance takes over
  useEffect(() => {
    if (!isSupported) return;

    const onEnd = () => {
      if (activeSpeakerId === idRef.current) {
        activeSpeakerId = null;
      }
      setIsSpeaking(false);
    };

    // Poll to detect when another instance cancelled us
    const interval = setInterval(() => {
      if (isSpeaking && activeSpeakerId !== idRef.current) {
        setIsSpeaking(false);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isSupported, isSpeaking]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;

      // Stop any current speech (from any bubble)
      window.speechSynthesis.cancel();
      activeSpeakerId = idRef.current;

      // Strip markdown formatting for cleaner speech
      const cleanText = text
        .replace(/[#*_~`>]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n+/g, '. ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Prefer a natural-sounding voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.name.includes('Samantha') ||
          v.name.includes('Google') ||
          v.name.includes('Natural')
      );
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        activeSpeakerId = null;
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        activeSpeakerId = null;
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      activeSpeakerId = null;
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return { isSpeaking, speak, stop, isSupported };
}
