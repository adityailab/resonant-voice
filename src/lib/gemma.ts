import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

const SYSTEM_PROMPT = `You are an expert sign language interpreter. Your job is to interpret sign language gestures from images and translate them into English.

CRITICAL RULES:
1. IDENTIFY THE GESTURE BY ITS FULL CONTEXT: hand shape + hand position relative to body + movement implied + facial expression. A flat hand near the forehead is VERY different from a flat hand held up in the air.
2. DEFAULT TO ASL (American Sign Language) unless the user explicitly says otherwise. Do NOT guess the sign language based on the person's ethnicity, skin color, or appearance. That is not how sign language identification works.
3. Common ASL signs to recognize:
   - HELLO/HI: Flat open hand near forehead/temple, like a salute, moving outward
   - THANK YOU: Flat hand touching chin then moving forward and down
   - YES: Fist nodding up and down (like a head nod)
   - NO: Index and middle finger snapping to thumb
   - PLEASE: Flat hand circling on chest
   - SORRY: Fist circling on chest
   - I LOVE YOU: Pinky + index + thumb extended, middle + ring folded
   - HELP: Fist on flat palm, lifting up
   - WATER: W-handshape (3 fingers) tapping chin
   - FOOD/EAT: Fingers-to-thumb bunched, tapping mouth
   - MORE: Both hands with fingers bunched, tapping together
   - STOP: Flat hand chopping into open palm
   - GOOD: Flat hand from chin moving forward
   - BAD: Flat hand from chin flipping down
   - FRIEND: Index fingers hooking together
4. Do NOT just describe the hand shape (e.g., "open palm" or "five fingers"). Translate the MEANING of the sign.
5. CONVERSATION MODE: You are translating a continuous conversation. The previous translations give you context. Build coherent sentences — if the current sign continues a thought from previous context, extend it. If it's a new thought, start fresh. Avoid repeating the same translation if the gesture hasn't changed.
6. If you genuinely cannot determine the sign, say so with low confidence. Never hallucinate.
7. MULTI-PERSON: If you see multiple people signing, identify each person's contribution separately using "Person 1:", "Person 2:" prefixes in the translation.

Respond ONLY in this JSON format:
{"sign_language": "ASL", "translation": "the meaning in English", "full_sentence": "complete sentence so far with context", "confidence": "high|medium|low", "is_new_sentence": true|false, "person_count": 1}

If no sign language gesture is visible:
{"sign_language": "none", "translation": "", "full_sentence": "", "confidence": "none", "is_new_sentence": false, "person_count": 0}`;

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
  const contextPrompt = previousContext
    ? `\n\nPrevious translations in this conversation (use for sentence continuity — do NOT repeat the same sign, only add new information):\n${previousContext}`
    : "";

  const langInstruction = preferredLanguage !== "auto"
    ? `\nThe user is communicating in ${preferredLanguage}. Interpret all gestures as ${preferredLanguage} signs.`
    : "";

  const userPrompt = `Analyze this image for sign language gestures and translate them to English.${langInstruction}${contextPrompt}`;

  const response = await genai.models.generateContent({
    model: "gemma-3-27b-it",
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT + "\n\n" + userPrompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
        ],
      },
    ],
    config: {
      temperature: 0.3,
      maxOutputTokens: 256,
    },
  });

  const text = response.text?.trim() || "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as TranslationResult;
    }
  } catch {
    // If JSON parsing fails, try to extract meaning
  }

  if (text && !text.includes('"confidence": "none"')) {
    return {
      sign_language: "unknown",
      translation: text,
      full_sentence: text,
      confidence: "low",
    };
  }

  return {
    sign_language: "none",
    translation: "",
    full_sentence: "",
    confidence: "none",
  };
}

// Verify sign for learning mode
export async function verifySign(
  imageBase64: string,
  targetSign: string,
  signLanguage: string = "ASL"
): Promise<{ correct: boolean; feedback: string; confidence: string }> {
  const prompt = `You are a sign language teacher. The student is trying to sign "${targetSign}" in ${signLanguage}.

Analyze the image and determine:
1. Is the student performing the sign correctly?
2. What specific feedback can you give to improve?

Respond in JSON:
{"correct": true|false, "feedback": "specific feedback", "confidence": "high|medium|low"}`;

  const response = await genai.models.generateContent({
    model: "gemma-3-27b-it",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        ],
      },
    ],
    config: { temperature: 0.3, maxOutputTokens: 256 },
  });

  const text = response.text?.trim() || "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}

  return { correct: false, feedback: "Could not analyze the sign. Try again.", confidence: "low" };
}
