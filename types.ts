import { Modality } from "@google/genai";

export enum DemoType {
  CHAT = 'CHAT',
  VISION = 'VISION',
  JSON = 'JSON',
  LIVE = 'LIVE',
  SEARCH = 'SEARCH',
  SPEECH = 'SPEECH',
  IMAGE_GEN = 'IMAGE_GEN',
  FUNCTION_CALLING = 'FUNCTION_CALLING',
  VIDEO_GEN = 'VIDEO_GEN',
  TRANSCRIPTION = 'TRANSCRIPTION'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Recipe {
  recipeName: string;
  ingredients: string[];
  instructions: string;
}

// Helper types for Live API
export interface LiveConfig {
  model: string;
  responseModalities: Modality[];
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: string;
      }
    }
  }
}

// Dev Console Types
export type LogType = 'info' | 'success' | 'error' | 'request' | 'response';

export interface DevLog {
  id: string;
  timestamp: Date;
  type: LogType;
  title: string;
  data?: any;
  latencyMs?: number;
}

export interface DevContextType {
  logs: DevLog[];
  addLog: (log: Omit<DevLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  codeSnippet: string;
  setCodeSnippet: (code: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// Global declaration for AI Studio helper
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}