import { ALLOWED_MIME_TYPES, MAX_IMAGE_SIZE } from "@common/image";
import { HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { analyzeSentence } from "@/lib/analysis";
import { auth } from "@/lib/auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { saveToHistory } from "@/lib/history";
import { resolveSettings } from "@/lib/settings";

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
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-3-flash-preview",
    apiKey: process.env.GOOGLE_API_KEY,
    maxOutputTokens: 512,
    temperature: 0,
  });

  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text: "Extract the Japanese sentence from this image. Return ONLY the Japanese text, nothing else. Do not add any explanation, translation, or commentary. You must not include the furigana.",
      },
      {
        type: "image_url",
        image_url: `data:${mimeType};base64,${base64Data}`,
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

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

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

    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return jsonResponse(
        {
          error:
            "Server Error: Google API key not configured. Required for image text extraction.",
        },
        500,
      );
    }

    const { provider, model } = await resolveSettings(session);

    const base64Data = await fileToBase64(imageFile);

    let sentence: string;
    try {
      sentence = await extractSentenceFromImage(base64Data, imageFile.type);
    } catch (error) {
      console.error("Error extracting text from image:", error);
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

    const analysis = await analyzeSentence(sentence, provider, model);

    if (session) {
      try {
        await saveToHistory(
          session.user.id,
          sentence,
          provider,
          model,
          analysis,
        );
      } catch (e) {
        console.error("Failed to save history:", e);
      }
    }

    return jsonResponse({ sentence, analysis });
  } catch (error) {
    console.error("Error in analyze-image:", error);
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze image",
      },
      500,
    );
  }
}
