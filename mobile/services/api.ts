import { buildApiUrl } from '@/constants/api';

/**
 * Analysis response type
 * Matches the response from the Next.js /api/analyze endpoint
 */
export interface WordAnalysis {
  id: string;
  text: string;
  reading: string | null;
  partOfSpeech: string;
  modifies: string[] | null;
  position: number;
  attachedParticle: {
    text: string;
    reading: string | null;
    description: string;
  } | null;
  isTopic: boolean | null;
}

export interface SentenceAnalysis {
  originalSentence: string;
  words: WordAnalysis[];
  explanation: string;
  isFragment: boolean;
}

export type Provider = 'anthropic' | 'openai' | 'google' | 'xai' | 'openrouter';

/**
 * API Error class for handling API-specific errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Analyze a Japanese sentence using the configured LLM provider
 * 
 * @param sentence - The Japanese sentence to analyze
 * @param provider - The LLM provider to use
 * @param model - The model name for the provider
 * @returns The sentence analysis result
 * @throws ApiError if the request fails
 */
export async function analyzeSentence(
  sentence: string,
  provider: Provider,
  model: string,
): Promise<SentenceAnalysis> {
  const url = buildApiUrl('analyze');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sentence, provider, model }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || 'Failed to analyze sentence',
      response.status,
    );
  }

  return data as SentenceAnalysis;
}
