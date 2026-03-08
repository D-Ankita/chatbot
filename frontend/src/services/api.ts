import type { QueryRequest, QueryResponse, HealthStatus } from '../types/chat';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function sendQuery(request: QueryRequest): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE}/health`);

  if (!response.ok) {
    throw new Error('Service unavailable');
  }

  return response.json();
}

export async function triggerIngestion(): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Ingestion failed');
  }

  return response.json();
}
