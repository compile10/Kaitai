import type {
  ImageAnalysisResponse,
  Provider,
  SentenceAnalysis,
} from "./types";

/**
 * API Error class for handling API-specific errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Analyze a Japanese sentence using the configured LLM provider
 *
 * @param url - The API endpoint URL (platform-specific)
 * @param sentence - The Japanese sentence to analyze
 * @param provider - The LLM provider to use
 * @param model - The model name for the provider
 * @returns The sentence analysis result
 * @throws ApiError if the request fails
 */
export async function analyzeSentence(
  url: string,
  sentence: string,
  provider: Provider,
  model: string,
): Promise<SentenceAnalysis> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sentence, provider, model }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || "Failed to analyze sentence",
      response.status,
    );
  }

  return data as SentenceAnalysis;
}

/**
 * Analyze a Japanese sentence from an image using vision extraction + LLM analysis
 *
 * @param url - The API endpoint URL (platform-specific)
 * @param image - The image file to extract text from
 * @param provider - The LLM provider to use for analysis
 * @param model - The model name for the provider
 * @returns The extracted sentence and its analysis
 * @throws ApiError if the request fails
 */
export async function analyzeImage(
  url: string,
  image: File | Blob,
  provider: Provider,
  model: string,
): Promise<ImageAnalysisResponse> {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("provider", provider);
  formData.append("model", model);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || "Failed to analyze image",
      response.status,
    );
  }

  return data as ImageAnalysisResponse;
}
