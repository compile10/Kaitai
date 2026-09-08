import { ChatOpenAI } from "@langchain/openai";

export const ANALYSIS_PROVIDER = "openrouter";
export const ANALYSIS_MODEL = "google/gemini-3.8-flash";

/** Creates the OpenRouter client for sentence analysis and image extraction. */
export function createChatModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Server Error: AI service not configured.");
  }

  return new ChatOpenAI({
    model: ANALYSIS_MODEL,
    apiKey,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
    maxTokens: 4096,
  });
}
