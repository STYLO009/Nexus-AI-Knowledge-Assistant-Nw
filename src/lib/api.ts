import type { Citation, Document } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export interface ChatResponse {
  answer: string;
  citations: Citation[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error(`Could not reach the API at ${API_URL || 'the current host'}.`);
  }
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json() as { detail?: string };
      detail = body.detail ? `: ${body.detail}` : '';
    } catch {
      // Keep the status message when the server response is not JSON.
    }
    throw new Error(`API request failed (${response.status})${detail}`);
  }
  return response.json() as Promise<T>;
}

export function askKnowledgeBase(query: string, documentIds: string[]) {
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, document_ids: documentIds }),
  });
}

export function uploadKnowledgeDocument(file: File) {
  const body = new FormData();
  body.append('file', file);
  return request<Document>('/api/documents/upload', { method: 'POST', body });
}

export function listKnowledgeDocuments() {
  return request<Document[]>('/api/documents');
}

export function authenticateWithGoogle(credential: string) {
  return request<AuthenticatedUser>('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
}
