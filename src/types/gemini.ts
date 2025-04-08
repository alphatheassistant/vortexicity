export type GeminiModel = 'gemini-pro' | 'gemini-pro-vision';

export interface FileContext {
  path: string;
  content: string;
  language?: string;
}

export interface GeminiConfig {
  model: GeminiModel;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface FileOperation {
  type: 'create' | 'edit' | 'delete';
  path: string;
  language?: string;
  content?: string;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  fileOperations?: FileOperation[];
  isStreaming?: boolean;
}

export interface AICoworkerState {
  messages: Message[];
  config: GeminiConfig;
  isTyping: boolean;
  activeFile?: string;
} 