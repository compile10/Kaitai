import type { ImageAnalysisResponse, SentenceAnalysis } from "./types";

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
 * Analyze a Japanese sentence. The server resolves which provider/model to use
 * based on the authenticated user's settings (or defaults for anonymous).
 */
export async function analyzeSentence(
  url: string,
  sentence: string,
): Promise<SentenceAnalysis> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sentence }),
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
 * Analyze a Japanese sentence from an image. The server resolves which
 * provider/model to use based on the authenticated user's settings.
 */
export async function analyzeImage(
  url: string,
  image: File | Blob,
): Promise<ImageAnalysisResponse> {
  const formData = new FormData();
  formData.append("image", image);

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
