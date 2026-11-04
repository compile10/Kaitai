/** Fields shared by every node in a sentence analysis. */
interface BaseNode {
  id: string;
  text: string;
  position: number; // Position in the sentence, counting every node
}

export interface WordNode extends BaseNode {
  type: "word";
  translation: string;
  reading: string | null;
  partOfSpeech: string;
  modifies: string[] | null; // IDs of word nodes this word modifies
  attachedParticle: {
    text: string;
    reading: string | null;
    description: string; // Brief explanation of the particle's function in this context
  } | null; // Particle attached to this word (if any)
  isTopic: boolean | null; // True if this is the sentence topic
}

/** A punctuation mark or symbol (。、？「」…♪); never modifies or carries particles. */
export interface PunctuationNode extends BaseNode {
  type: "punctuation";
  description: string; // Its function in this sentence
}

export type SentenceNode = WordNode | PunctuationNode;

export function isPunctuationNode(node: SentenceNode): node is PunctuationNode {
  return node.type === "punctuation";
}

export interface GrammarPoint {
  title: string; // e.g. "は (Topic Marker)", "て-form (Connective)"
  explanation: string; // Plain text, 2-3 sentences explaining this grammar point in context
}

export interface SentenceAnalysis {
  directTranslation: string;
  nodes: SentenceNode[]; // Words and punctuation in sentence order
  explanation: string;
  isFragment: boolean; // True if this is a sentence fragment/incomplete sentence
  grammarPoints: GrammarPoint[];
}

export interface ImageAnalysisResponse {
  sentence: string;
  analysis: SentenceAnalysis;
}

export interface InviteCode {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateInviteCodeResponse {
  inviteCode: InviteCode;
}

// History types
export interface HistoryEntry {
  id: string;
  sentence: string;
  createdAt: string; // ISO date string
}

export interface PaginatedHistory {
  items: HistoryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Account preferences exposed by the settings API. */
export interface UserSettings {
  showWordTranslations: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  showWordTranslations: true,
};
