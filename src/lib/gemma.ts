import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

// Trimmed prompt — every token saved = faster response
const SYSTEM_PROMPT = `Expert sign language interpreter. Translate gestures from images to English.

RULES:
- Identify by FULL CONTEXT: hand shape + position relative to body + movement + facial expression
- Default to ASL unless told otherwise. Never guess language by appearance.
- ASL signs: HELLO=flat hand salute from forehead, THANK YOU=chin to forward, YES=fist nod, NO=fingers snap to thumb, PLEASE=flat circle chest, SORRY=fist circle chest, I LOVE YOU=pinky+index+thumb out, HELP=fist on palm lift, WATER=W-hand tap chin, EAT=bunched fingers tap mouth, MORE=bunched hands tap together, STOP=chop into palm, GOOD=chin forward, BAD=chin flip down
- Translate MEANING not hand description
- Use previous context to build sentences. Don't repeat unchanged signs.
- Multiple signers: prefix "Person 1:", "Person 2:"

JSON only: {"sign_language":"ASL","translation":"text","full_sentence":"full text","confidence":"high|medium|low"}
No gesture: {"sign_language":"none","translation":"","full_sentence":"","confidence":"none"}`;

export interface TranslationResult {
  sign_language: string;
  translation: string;
  full_sentence: string;
  confidence: "high" | "medium" | "low" | "none";
  is_new_sentence?: boolean;
  person_count?: number;
}

export async function translateSignLanguage(
  imageBase64: string,
  previousContext: string = "",
  preferredLanguage: string = "ASL"
): Promise<TranslationResult> {
  const ctx = previousContext ? `\nPrior: ${previousContext}` : "";
  const lang = preferredLanguage !== "auto" ? `\nLanguage: ${preferredLanguage}` : "";

  const response = await genai.models.generateContent({
    model: "gemma-3-4b-it",
    contents: [
      {
        role: "user",
        parts: [
          { text: `${SYSTEM_PROMPT}${lang}${ctx}\n\nTranslate the sign language in this image:` },
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        ],
      },
    ],
    config: { temperature: 0.2, maxOutputTokens: 150 },
  });

  const text = response.text?.trim() || "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as TranslationResult;
  } catch {}

  if (text && !text.includes('"confidence": "none"')) {
    return { sign_language: "unknown", translation: text, full_sentence: text, confidence: "low" };
  }

  return { sign_language: "none", translation: "", full_sentence: "", confidence: "none" };
}

// Streaming version — returns an async generator that yields partial text
export async function* translateSignLanguageStream(
  imageBase64: string,
  previousContext: string = "",
  preferredLanguage: string = "ASL"
): AsyncGenerator<string> {
  const ctx = previousContext ? `\nPrior: ${previousContext}` : "";
  const lang = preferredLanguage !== "auto" ? `\nLanguage: ${preferredLanguage}` : "";

  const response = await genai.models.generateContentStream({
    model: "gemma-3-4b-it",
    contents: [
      {
        role: "user",
        parts: [
          { text: `${SYSTEM_PROMPT}${lang}${ctx}\n\nTranslate the sign language in this image:` },
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        ],
      },
    ],
    config: { temperature: 0.2, maxOutputTokens: 150 },
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) yield text;
  }
}

// Verify sign for learning mode
export async function verifySign(
  imageBase64: string,
  targetSign: string,
  signLanguage: string = "ASL"
): Promise<{ correct: boolean; feedback: string; confidence: string }> {
  const response = await genai.models.generateContent({
    model: "gemma-3-4b-it",
    contents: [
      {
        role: "user",
        parts: [
          { text: `Sign language teacher. Student signs "${targetSign}" in ${signLanguage}. Is it correct? JSON: {"correct":bool,"feedback":"text","confidence":"high|medium|low"}` },
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        ],
      },
    ],
    config: { temperature: 0.3, maxOutputTokens: 150 },
  });

  const text = response.text?.trim() || "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}

  return { correct: false, feedback: "Could not analyze the sign. Try again.", confidence: "low" };
}
