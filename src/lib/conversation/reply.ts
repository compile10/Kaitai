import type { ConversationMessage, Provider } from "@common/types";
import { createChatModel } from "@/lib/analysis/providers";
import { replySchema } from "./schema";

const SYSTEM_PROMPT = `You are a Japanese conversation practice partner. Your role is to have a natural, helpful conversation in Japanese on the given topic.

RULES:
1. Always respond in Japanese. Use natural, everyday Japanese.
2. Adapt your language level to match the user's apparent ability. If they use simple grammar, keep yours accessible. If they use advanced patterns, you can be more sophisticated.
3. Stay on topic but let the conversation flow naturally.
4. Ask follow-up questions to keep the conversation going.
5. If the user makes a grammatical mistake, do NOT correct them — just continue the conversation naturally. The evaluation happens separately.
6. After roughly 8-15 total messages (combined user + assistant), begin wrapping up the conversation naturally. Don't end abruptly — guide toward a natural conclusion (e.g. a goodbye, wrapping up plans, thanking each other).
7. Set isConversationComplete to true ONLY when the conversation has reached a genuine, natural ending point (e.g. after a goodbye exchange).

TOPIC: {{TOPIC}}`;

function buildMessages(
  topic: string,
  history: ConversationMessage[],
  userMessage: string,
) {
  const systemMessage = SYSTEM_PROMPT.replace("{{TOPIC}}", topic);

  const langchainMessages: { role: string; content: string }[] = [
    { role: "system", content: systemMessage },
  ];

  for (const msg of history) {
    langchainMessages.push({
      role: msg.role === "user" ? "human" : msg.role,
      content: msg.content,
    });
  }

  langchainMessages.push({ role: "human", content: userMessage });

  return langchainMessages;
}

export async function conversationReply(
  topic: string,
  history: ConversationMessage[],
  userMessage: string,
  provider: Provider,
  model: string,
): Promise<{ message: string; isConversationComplete: boolean }> {
  const chatModel = createChatModel(provider, model);
  const structuredModel = chatModel.withStructuredOutput(replySchema, {
    name: "conversation_reply",
  });

  const messages = buildMessages(topic, history, userMessage);
  const result = await structuredModel.invoke(messages);

  return {
    message: result.message,
    isConversationComplete: result.isConversationComplete,
  };
}

export async function generateGreeting(
  topic: string,
  provider: Provider,
  model: string,
): Promise<string> {
  const chatModel = createChatModel(provider, model);
  const structuredModel = chatModel.withStructuredOutput(replySchema, {
    name: "conversation_reply",
  });

  const systemMessage = SYSTEM_PROMPT.replace("{{TOPIC}}", topic);
  const messages = [
    { role: "system", content: systemMessage },
    {
      role: "human",
      content:
        "Start the conversation by greeting me and introducing the topic naturally in Japanese. This is the very first message.",
    },
  ];

  const result = await structuredModel.invoke(messages);
  return result.message;
}
