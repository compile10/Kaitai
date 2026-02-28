import { z } from "zod";

export const replySchema = z.object({
  message: z
    .string()
    .describe("Your Japanese reply in this conversation. Write naturally."),
  isConversationComplete: z
    .boolean()
    .describe(
      "True if the conversation has reached a natural conclusion (e.g. a goodbye exchange, the topic has been fully discussed, or 8-15 total exchanges have occurred). False otherwise.",
    ),
});

export const scoreSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Overall score from 0 to 100 evaluating the user's Japanese ability in this conversation.",
    ),
  didWell: z
    .array(z.string())
    .describe(
      "Array of 2-4 specific things the user did well, in English. Be concrete and reference examples from the conversation.",
    ),
  needsImprovement: z
    .array(z.string())
    .describe(
      "Array of 2-4 specific areas where the user could improve, in English. Be constructive and reference examples from the conversation.",
    ),
});
