import { translateSignLanguage } from "@/lib/gemma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY === "your_api_key_here") {
      return NextResponse.json(
        { error: "GOOGLE_AI_API_KEY not configured. Add your key to .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { image, context, language } = body as {
      image: string; // base64 encoded image (no data:image prefix)
      context?: string;
      language?: string; // "ASL" | "ISL" | "BSL" | "auto"
    };

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const result = await translateSignLanguage(image, context || "", language || "ASL");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      {
        error: "Translation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
