export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'md';
  size: number;
  uploadedAt: string;
  status: 'processing' | 'indexed' | 'error';
  chunks: number;
  tokens: number;
  summary?: string;
  tags: string[];
}

export interface Citation {
  docId: string;
  docName: string;
  page?: number;
  chunk: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: string;
  streaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  documentIds: string[];
}

export type Page = 'login' | 'dashboard' | 'chat' | 'documents' | 'comparison' | 'settings' | 'api-docs';
