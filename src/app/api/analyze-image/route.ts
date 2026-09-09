import { MAX_SENTENCE_LENGTH } from "@common/api";
import { ALLOWED_MIME_TYPES, MAX_IMAGE_SIZE } from "@common/image";
import { HumanMessage } from "@langchain/core/messages";
import {
  ANALYSIS_MODEL,
  ANALYSIS_PROVIDER,
  analyzeSentence,
  createChatModel,
} from "@/lib/analysis";
import { withAuth } from "@/lib/api-auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { saveToHistory } from "@/lib/history";
import { reportError } from "@/lib/monitoring/logger";
import { RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { sanitizeForLLM } from "@/lib/validation";

export async function OPTIONS() {
  return corsPreflightResponse();
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}

async function extractSentenceFromImage(
  base64Data: string,
  mimeType: string,
): Promise<string> {
  const model = createChatModel("image.extract");

  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text: "Extract the Japanese sentence from this image. Return ONLY the Japanese text, nothing else. Do not add any explanation, translation, or commentary. You must not include the furigana.",
      },
      {
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${base64Data}` },
      },
    ],
  });

  const response = await model.invoke([message]);
  const extractedText =
    typeof response.content === "string" ? response.content : "";

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error("No Japanese text could be extracted from the image");
  }

  return extractedText.trim();
}

export const POST = withAuth(
  {
    name: "analyze image",
    rateLimit: RATE_LIMIT_POLICIES.analyzeImage,
  },
  async (request, session) => {
    const formData = (await request.formData()) as unknown as {
      get(name: string): File | string | null;
    };
    const imageFile = formData.get("image");

    if (!imageFile || !(imageFile instanceof File)) {
      return jsonResponse({ error: "No image file provided" }, 400);
    }

    if (!ALLOWED_MIME_TYPES.has(imageFile.type)) {
      return jsonResponse(
        {
          error: `Unsupported image type: ${imageFile.type}. Supported: png, jpeg, gif, webp`,
        },
        400,
      );
    }

    if (imageFile.size > MAX_IMAGE_SIZE) {
      return jsonResponse({ error: "Image exceeds maximum size of 20MB" }, 400);
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return jsonResponse(
        {
          error: "Server Error: AI service not configured.",
        },
        500,
      );
    }

    const base64Data = await fileToBase64(imageFile);

    let sentence: string;
    try {
      sentence = sanitizeForLLM(
        await extractSentenceFromImage(base64Data, imageFile.type),
      );
    } catch (error) {
      reportError(error, "image.extract");
      return jsonResponse(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to extract text from image",
        },
        502,
      );
    }

    if (!sentence) {
      return jsonResponse({ error: "Invalid sentence provided" }, 400);
    }

    if (sentence.length > MAX_SENTENCE_LENGTH) {
      return jsonResponse(
        {
          error: `Sentence exceeds maximum length of ${MAX_SENTENCE_LENGTH} characters`,
        },
        400,
      );
    }

    const analysis = await analyzeSentence(sentence);

    try {
      await saveToHistory(
        session.user.id,
        sentence,
        ANALYSIS_PROVIDER,
        ANALYSIS_MODEL,
      );
    } catch (e) {
      reportError(e, "history.save");
    }

    return jsonResponse({ sentence, analysis });
  },
);
