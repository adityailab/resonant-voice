"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface TranslationEntry {
  translation: string;
  sign_language: string;
  full_sentence: string;
  confidence: "high" | "medium" | "low" | "none";
  timestamp: number;
}

interface UseSignLanguageTranslationOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  captureInterval?: number; // milliseconds, default 2500
  language?: string; // "ASL" | "ISL" | "BSL" | "auto"
}

export function useSignLanguageTranslation({
  videoRef,
  isActive,
  captureInterval = 2500,
  language = "ASL",
}: UseSignLanguageTranslationOptions) {
  const [currentTranslation, setCurrentTranslation] = useState<string>("");
  const [fullSentence, setFullSentence] = useState<string>("");
  const [signLanguage, setSignLanguage] = useState<string>("");
  const [confidence, setConfidence] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranslationEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create canvas for frame capture
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    canvas.width = 640; // Downscale for API efficiency
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, 640, 480);
    // Get base64 without the data:image/jpeg;base64, prefix
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    return dataUrl.split(",")[1];
  }, [videoRef]);

  const translate = useCallback(async () => {
    if (isProcessing) return;

    const imageBase64 = captureFrame();
    if (!imageBase64) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Build context from recent history
      const recentContext = history
        .slice(-5)
        .map((h) => h.translation)
        .filter(Boolean)
        .join(". ");

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          context: recentContext,
          language,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Translation failed");
      }

      const result = await response.json();

      if (result.confidence !== "none" && result.translation) {
        setCurrentTranslation(result.translation);
        setFullSentence(result.full_sentence || result.translation);
        setSignLanguage(result.sign_language);
        setConfidence(result.confidence);

        setHistory((prev) => [
          ...prev,
          {
            translation: result.translation,
            sign_language: result.sign_language,
            full_sentence: result.full_sentence,
            confidence: result.confidence,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setIsProcessing(false);
    }
  }, [captureFrame, isProcessing, history]);

  // Auto-capture loop
  useEffect(() => {
    if (isActive) {
      // Initial capture after a short delay
      const initialTimeout = setTimeout(translate, 1000);
      intervalRef.current = setInterval(translate, captureInterval);

      return () => {
        clearTimeout(initialTimeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isActive, captureInterval, translate]);

  const clearAll = useCallback(() => {
    setCurrentTranslation("");
    setFullSentence("");
    setSignLanguage("");
    setConfidence("");
    setHistory([]);
    setError(null);
  }, []);

  return {
    currentTranslation,
    fullSentence,
    signLanguage,
    confidence,
    isProcessing,
    error,
    history,
    clearAll,
    manualCapture: translate,
  };
}
