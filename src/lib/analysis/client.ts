import { ChatOpenAI } from "@langchain/openai";
import { AIMonitoringHandler, type AIStage } from "@/lib/monitoring/ai";

export const ANALYSIS_MODEL = "google/gemini-4-hydrogen";

export function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  return apiKey;
}

/** Creates the OpenRouter client for sentence analysis and image extraction. */
export function createChatModel(stage: AIStage = "analysis") {
  return new ChatOpenAI({
    model: ANALYSIS_MODEL,
    apiKey: getOpenRouterApiKey(),
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
    modelKwargs: { reasoning: { effort: "low" } },
    callbacks: [new AIMonitoringHandler(stage)],
    maxTokens: 8192,
    timeout: 90_000,
    maxRetries: 1,
  });
}
