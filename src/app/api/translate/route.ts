import { translateSignLanguage, translateSignLanguageStream } from "@/lib/gemma";
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
    const { image, context, language, stream } = body as {
      image: string;
      context?: string;
      language?: string;
      stream?: boolean;
    };

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Streaming mode — sends partial text as SSE
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let fullText = "";
            for await (const chunk of translateSignLanguageStream(image, context || "", language || "ASL")) {
              fullText += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk, partial: fullText })}\n\n`));
            }

            // Parse final result
            let result;
            try {
              const jsonMatch = fullText.match(/\{[\s\S]*\}/);
              if (jsonMatch) result = JSON.parse(jsonMatch[0]);
            } catch {}

            if (!result) {
              result = { sign_language: "unknown", translation: fullText, full_sentence: fullText, confidence: "low" };
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, result })}\n\n`));
            controller.close();
          } catch (err) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming mode
    const result = await translateSignLanguage(image, context || "", language || "ASL");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Translation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
