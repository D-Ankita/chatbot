import { useState, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { checkHealth } from './services/api';

function App() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let delay = 10_000; // normal poll interval
    let cancelled = false;

    const check = async () => {
      try {
        const health = await checkHealth();
        setStatus('connected');
        setDocCount(health.documents_indexed);
        delay = 10_000; // reset to normal interval on success
      } catch {
        setStatus('disconnected');
        // Backoff: first failure resets to 3s, then doubles (6s → 12s → 24s → 30s cap)
        delay = delay >= 10_000 ? 3_000 : Math.min(delay * 2, 30_000);
      }
      if (!cancelled) {
        timer = setTimeout(check, delay);
      }
    };

    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9' }}>
      {/* Header */}
      <header className="app-header" style={{ padding: '12px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #14b8a6, #059669)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                MedAssist AI
              </h1>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginTop: '1px' }}>
                Healthcare Information Assistant
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {docCount > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#64748b',
                background: '#f8fafc',
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontWeight: 500,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                {docCount} docs
              </span>
            )}
            <span className={`status-badge ${
              status === 'connected' ? 'status-connected'
                : status === 'connecting' ? 'status-connecting'
                : 'status-disconnected'
            }`}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: status === 'connected' ? '#10b981'
                  : status === 'connecting' ? '#f59e0b'
                  : '#ef4444',
                display: 'inline-block',
                ...(status === 'connecting' ? { animation: 'blink 1.4s infinite' } : {}),
              }} />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>
      </header>

      {/* Disconnected warning */}
      {status === 'disconnected' && (
        <div style={{
          background: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          padding: '10px 24px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>
            Backend not reachable.{' '}
            <code style={{
              background: '#fee2e2',
              padding: '2px 8px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}>
              cd backend/ai-service && python main.py
            </code>
          </p>
        </div>
      )}

      {/* Chat area */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        <ChatWindow />
      </main>
    </div>
  );
}

export default App;
