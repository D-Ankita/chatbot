import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types/chat';
import { sendQuery } from '../services/api';
import { MessageBubble } from './MessageBubble';
import { VoiceInput } from './VoiceInput';

const SUGGESTIONS = [
  { icon: '🩺', text: 'What are common symptoms of diabetes?' },
  { icon: '🤧', text: 'How to treat a cold at home?' },
  { icon: '💊', text: 'What is high blood pressure?' },
  { icon: '🩹', text: 'First aid for a minor burn' },
  { icon: '🧠', text: 'How to manage stress and anxiety?' },
  { icon: '🏥', text: 'When should I see a doctor for flu?' },
];

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasMessages = messages.length > 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = useCallback(
    async (text?: string) => {
      const question = (text || input).trim();
      if (!question || isLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      };

      const loadingMessage: ChatMessage = {
        id: `loading-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage, loadingMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const chatHistory = messages
          .filter((m) => !m.isLoading)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await sendQuery({
          question,
          chat_history: chatHistory,
        });

        const assistantMessage: ChatMessage = {
          id: `response-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          intent: response.intent as ChatMessage['intent'],
          sources: response.sources,
        };

        setMessages((prev) =>
          prev.filter((m) => !m.isLoading).concat(assistantMessage)
        );
      } catch {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            'Sorry, I encountered an error. Please make sure the backend service is running and try again.',
          timestamp: new Date(),
        };

        setMessages((prev) =>
          prev.filter((m) => !m.isLoading).concat(errorMessage)
        );
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      if (text.trim()) {
        setInput(text);
        setTimeout(() => handleSubmit(text), 300);
      }
    },
    [handleSubmit]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        {!hasMessages ? (
          /* ---- Welcome screen ---- */
          <div className="fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '20px 16px',
          }}>
            {/* Icon */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #14b8a6, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              boxShadow: '0 8px 24px rgba(20, 184, 166, 0.25)',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
              </svg>
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: 'clamp(22px, 4vw, 30px)',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '8px',
              textAlign: 'center',
              letterSpacing: '-0.02em',
            }}>
              How can I help you today?
            </h2>
            <p style={{
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              color: '#94a3b8',
              textAlign: 'center',
              maxWidth: '420px',
              lineHeight: 1.6,
              marginBottom: '32px',
            }}>
              Ask me any health question. I provide reliable, cited answers from trusted medical sources.
            </p>

            {/* Suggestion cards */}
            <div className="stagger-in" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '10px',
              width: '100%',
              maxWidth: '620px',
            }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => handleSubmit(s.text)}
                  disabled={isLoading}
                  className="suggestion-card"
                >
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{s.icon}</span>
                  <span style={{ fontWeight: 500, lineHeight: 1.4 }}>{s.text}</span>
                </button>
              ))}
            </div>

            <p style={{
              fontSize: '11px',
              color: '#94a3b8',
              marginTop: '32px',
              textAlign: 'center',
              maxWidth: '360px',
              lineHeight: 1.5,
            }}>
              For informational purposes only — not medical advice. Always consult a healthcare professional.
            </p>
          </div>
        ) : (
          /* ---- Chat messages ---- */
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ---- Input bar ---- */}
      <div className="input-bar safe-bottom" style={{ padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', maxWidth: '860px', margin: '0 auto' }}>
          <VoiceInput onTranscript={handleVoiceTranscript} />

          <div style={{ flex: 1 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a health question..."
              style={{
                width: '100%',
                resize: 'none',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                padding: '12px 16px',
                fontSize: '15px',
                lineHeight: 1.5,
                outline: 'none',
                maxHeight: '128px',
                fontFamily: 'inherit',
                color: '#1e293b',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              rows={1}
              disabled={isLoading}
              onFocus={(e) => {
                e.target.style.borderColor = '#14b8a6';
                e.target.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '12px',
              borderRadius: '14px',
              background: isLoading || !input.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #14b8a6, #059669)',
              color: 'white',
              border: 'none',
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: isLoading || !input.trim() ? 'none' : '0 2px 8px rgba(20, 184, 166, 0.3)',
              flexShrink: 0,
              opacity: isLoading || !input.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>

        {hasMessages && (
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
            Not medical advice. Always consult a healthcare professional.
          </p>
        )}
      </div>
    </div>
  );
}
