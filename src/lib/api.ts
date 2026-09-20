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

export function uploadKnowledgeDocument(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Document> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/documents/upload`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 90));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as Document);
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        let detail = '';
        try {
          const body = JSON.parse(xhr.responseText) as { detail?: string };
          detail = body.detail ? `: ${body.detail}` : '';
        } catch { /* keep status message */ }
        reject(new Error(`Upload failed (${xhr.status})${detail}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error(`Could not reach the API at ${API_URL || 'the current host'}.`));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out. The file may be too large or the server is processing slowly.'));
    });

    xhr.timeout = 600_000; // 10 minutes

    const body = new FormData();
    body.append('file', file);
    xhr.send(body);
  });
}

export function listKnowledgeDocuments() {
  return request<Document[]>('/api/documents');
}

export function deleteKnowledgeDocument(docId: string) {
  return request<{ status: string }>(`/api/documents/${docId}`, { method: 'DELETE' });
}

export interface DashboardStats {
  totalDocuments: number;
  totalChunks: number;
  totalTokens: number;
  indexedDocuments: number;
  processingDocuments: number;
  errorDocuments: number;
  documentsThisWeek: number;
  chunksThisWeek: number;
  topDocuments: { name: string; chunks: number; tokens: number }[];
}

export function getDashboardStats() {
  return request<DashboardStats>('/api/stats');
}

export function authenticateWithGoogle(credential: string) {
  return request<AuthenticatedUser>('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
}
