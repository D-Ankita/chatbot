import type { ReactNode } from 'react';
import type { ChatMessage } from '../types/chat';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { isSpeaking, speak, stop, isSupported } = useTextToSpeech();
  const isUser = message.role === 'user';

  /**
   * Parse inline markdown (**bold**, *italic*) into React elements.
   * No dangerouslySetInnerHTML — fully safe from XSS.
   */
  const parseInlineMarkdown = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    // Match **bold** or *italic* segments
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Push text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2]) {
        // **bold**
        parts.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3]) {
        // *italic*
        parts.push(<em key={match.index}>{match[3]}</em>);
      }
      lastIndex = regex.lastIndex;
    }
    // Push remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : [text];
  };

  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {i > 0 && <br />}
        {parseInlineMarkdown(line)}
      </span>
    ));
  };

  const avatar = (
    <div style={{
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: '2px',
      ...(isUser
        ? { background: 'linear-gradient(135deg, #14b8a6, #059669)', boxShadow: '0 2px 6px rgba(20, 184, 166, 0.25)' }
        : { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
      ),
    }}>
      {isUser ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
          <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
        </svg>
      )}
    </div>
  );

  const bubble = (
    <div className={isUser ? 'bubble-user' : 'bubble-assistant'} style={{ maxWidth: 'min(75%, 520px)' }}>
      {/* Intent badge */}
      {!isUser && message.intent && message.intent !== 'ANSWER' && (
        <div style={{ marginBottom: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '8px',
            ...(message.intent === 'ESCALATE'
              ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }
              : { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }
            ),
          }}>
            {message.intent === 'ESCALATE' ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Seek Medical Attention
              </>
            ) : (
              'Needs Clarification'
            )}
          </span>
        </div>
      )}

      {/* Loading dots */}
      {message.isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px' }}>
          <span className="typing-dot" style={{ width: '8px', height: '8px', background: '#14b8a6', borderRadius: '50%', display: 'inline-block' }} />
          <span className="typing-dot" style={{ width: '8px', height: '8px', background: '#14b8a6', borderRadius: '50%', display: 'inline-block' }} />
          <span className="typing-dot" style={{ width: '8px', height: '8px', background: '#14b8a6', borderRadius: '50%', display: 'inline-block' }} />
        </div>
      ) : (
        <div style={{ fontSize: '14px', lineHeight: 1.7 }}>
          {formatContent(message.content)}
        </div>
      )}

      {/* Sources */}
      {!isUser && message.sources && message.sources.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Sources
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {message.sources.map((source, i) => (
              <span
                key={i}
                style={{
                  fontSize: '11px',
                  background: '#f8fafc',
                  color: '#64748b',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontWeight: 500,
                }}
              >
                {source.document} &middot; p.{source.page}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp + TTS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '8px',
        color: isUser ? 'rgba(255,255,255,0.6)' : '#94a3b8',
      }}>
        <span style={{ fontSize: '11px' }}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {!isUser && isSupported && !message.isLoading && (
          <button
            onClick={() => (isSpeaking ? stop() : speak(message.content))}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '2px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isSpeaking ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="msg-appear" style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }}>
      {isUser ? (
        <>
          {bubble}
          {avatar}
        </>
      ) : (
        <>
          {avatar}
          {bubble}
        </>
      )}
    </div>
  );
}
