export interface WordNode {
  id: string;
  text: string;
  reading: string | null;
  partOfSpeech: string;
  modifies: string[] | null; // IDs of words this word modifies
  position: number; // Position in the sentence
  attachedParticle: {
    text: string;
    reading: string | null;
    description: string; // Brief explanation of the particle's function in this context
  } | null; // Particle attached to this word (if any)
  isTopic: boolean | null; // True if this is the sentence topic
}

export interface GrammarPoint {
  title: string; // e.g. "は (Topic Marker)", "て-form (Connective)"
  explanation: string; // Plain text, 2-3 sentences explaining this grammar point in context
}

export interface SentenceAnalysis {
  directTranslation: string;
  words: WordNode[];
  explanation: string;
  isFragment: boolean; // True if this is a sentence fragment/incomplete sentence
  grammarPoints: GrammarPoint[];
}

export interface ImageAnalysisResponse {
  sentence: string;
  analysis: SentenceAnalysis;
}

// Provider types
export type Provider =
  | "anthropic"
  | "openai"
  | "google"
  | "xai"
  | "openrouter"
  | "cerebras"
  | "fireworks";

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  pricing?: string;
  speed?: string;
}

export interface ProviderConfig {
  id: Provider;
  name: string;
  models: ModelInfo[];
  defaultModel: string;
}
