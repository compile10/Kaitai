import type {
  ConversationMessage,
  ConversationScore,
  Provider,
} from "@common/types";
import { createChatModel } from "@/lib/analysis/providers";
import { scoreSchema } from "./schema";

const SCORE_PROMPT = `You are a Japanese language evaluator. You will be given a conversation transcript between a language learner (user) and a conversation partner (assistant). The conversation was on the topic: "{{TOPIC}}".

Evaluate ONLY the user's messages. Consider:
1. **Grammar accuracy**: Did the user use correct grammar? Were particles used correctly? Were verb conjugations right?
2. **Vocabulary range**: Did the user demonstrate varied vocabulary appropriate to the topic?
3. **Topic relevance**: Did the user stay on topic and contribute meaningfully?
4. **Naturalness**: Did the user's Japanese sound natural? Were appropriate expressions and politeness levels used?
5. **Communication ability**: Was the user able to express their ideas clearly and respond appropriately?

Score from 0-100 where:
- 90-100: Excellent — near-native usage with minor or no errors
- 80-89: Very good — mostly correct with occasional errors
- 70-79: Good — communicates effectively but with noticeable errors
- 60-69: Fair — gets the point across but with frequent errors
- 0-59: Needs work — significant difficulty communicating

Be fair but encouraging. Provide specific, actionable feedback referencing actual examples from the conversation.

CONVERSATION TRANSCRIPT:
{{TRANSCRIPT}}`;

function formatTranscript(messages: ConversationMessage[]): string {
  return messages
    .map((msg) => `${msg.role === "user" ? "User" : "Partner"}: ${msg.content}`)
    .join("\n");
}

export async function scoreConversation(
  topic: string,
  messages: ConversationMessage[],
  provider: Provider,
  model: string,
): Promise<ConversationScore> {
  const chatModel = createChatModel(provider, model);
  const structuredModel = chatModel.withStructuredOutput(scoreSchema, {
    name: "score_conversation",
  });

  const prompt = SCORE_PROMPT.replace("{{TOPIC}}", topic).replace(
    "{{TRANSCRIPT}}",
    formatTranscript(messages),
  );

  const result = await structuredModel.invoke(prompt);

  return {
    score: Math.round(Math.min(100, Math.max(0, result.score))),
    didWell: result.didWell,
    needsImprovement: result.needsImprovement,
  };
}
