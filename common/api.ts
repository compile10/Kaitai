import type {
  AccountProgress,
  AccountProgressUpdate,
  CreateInviteCodeResponse,
  ImageAnalysisResponse,
  InviteCode,
  SentenceAnalysis,
} from "./types";

/**
 * Newspaper Japanese is 97.5% ≤ 100 characters; academic ~70; literary
 * (Tanizaki) commonly exceeds 200. 220 covers long single sentences without
 * admitting paragraph dumps.
 */
export const MAX_SENTENCE_LENGTH = 220;

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
 * Analyze a Japanese sentence.
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
 * Analyze a Japanese sentence from an image.
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

/** Generate a temporary invite code for a permitted administrator. */
export async function createInviteCode(url: string): Promise<InviteCode> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || "Failed to generate an invite code",
      response.status,
    );
  }

  return (data as CreateInviteCodeResponse).inviteCode;
}

/** A fetch-compatible function; mobile passes its cookie-attaching authFetch. */
export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/** Fetch the signed-in account's flashcard progress. */
export async function fetchAccountProgress(
  url: string,
  fetcher: Fetcher = fetch,
): Promise<AccountProgress> {
  const response = await fetcher(url, {
    headers: { Accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.error || "Failed to load progress",
      response.status,
    );
  }
  return data as AccountProgress;
}

/** Change the daily quest target or time zone; returns the updated progress. */
export async function updateAccountProgress(
  url: string,
  update: AccountProgressUpdate,
  fetcher: Fetcher = fetch,
): Promise<AccountProgress> {
  const response = await fetcher(url, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(update),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.error || "Failed to save progress",
      response.status,
    );
  }
  return data as AccountProgress;
}
