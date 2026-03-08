import { useEffect } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechToText();

  useEffect(() => {
    if (!isListening && transcript) {
      onTranscript(transcript);
    }
  }, [isListening, transcript, onTranscript]);

  if (!isSupported) return null;

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      className={isListening ? 'mic-pulse' : ''}
      style={{
        position: 'relative',
        padding: '12px',
        borderRadius: '14px',
        border: isListening ? 'none' : '1px solid #e2e8f0',
        background: isListening ? '#ef4444' : '#ffffff',
        color: isListening ? '#ffffff' : '#94a3b8',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isListening ? '0 2px 8px rgba(239, 68, 68, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={isListening ? 'Stop recording' : 'Voice input'}
      type="button"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    </button>
  );
}
