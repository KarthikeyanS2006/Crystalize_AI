export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
  groundingChunks?: GroundingChunk[];
}

export interface Crystal {
  id: string;
  title: string;
  content: string; // The crystallized insight
  keywords: string[];
  sourceUrl?: string;
  category: string;
  createdAt: number;
}

export enum AppView {
  CHAT = 'CHAT',
  DATABASE = 'DATABASE',
}

// Schema for the crystallization process
export interface CrystalExtractionResponse {
  title: string;
  summary: string;
  keywords: string[];
  category: string;
}