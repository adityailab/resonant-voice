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
  captureInterval?: number;
  language?: string;
  handsDetected?: boolean;
  onTranslation?: (text: string, signLanguage: string) => void;
}

export function useSignLanguageTranslation({
  videoRef,
  isActive,
  captureInterval = 2500,
  language = "ASL",
  handsDetected = true,
  onTranslation,
}: UseSignLanguageTranslationOptions) {
  const [currentTranslation, setCurrentTranslation] = useState<string>("");
  const [fullSentence, setFullSentence] = useState<string>("");
  const [signLanguage, setSignLanguage] = useState<string>("");
  const [confidence, setConfidence] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingText, setStreamingText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranslationEntry[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const historyRef = useRef<TranslationEntry[]>([]);
  const isProcessingRef = useRef(false);
  const languageRef = useRef(language);
  const handsDetectedRef = useRef(handsDetected);
  const lastTranslationRef = useRef<string>("");
  const responseTimesRef = useRef<number[]>([]);
  const onTranslationRef = useRef(onTranslation);

  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { handsDetectedRef.current = handsDetected; }, [handsDetected]);
  useEffect(() => { onTranslationRef.current = onTranslation; }, [onTranslation]);

  useEffect(() => {
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, 320, 240);
    return canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
  }, [videoRef]);

  const translate = useCallback(async () => {
    if (isProcessingRef.current) return;
    if (!handsDetectedRef.current) return;

    const imageBase64 = captureFrame();
    if (!imageBase64) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setStreamingText("");
    setError(null);

    const startTime = Date.now();

    try {
      const recentContext = historyRef.current
        .slice(-3)
        .map((h) => h.translation)
        .filter(Boolean)
        .join(". ");

      // Use streaming for real-time feedback
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          context: recentContext,
          language: languageRef.current,
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Translation failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream reader");

      const decoder = new TextDecoder();
      let fullResult = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.chunk) {
              setStreamingText(data.partial || "");
            }

            if (data.done && data.result) {
              fullResult = data.result;
            }

            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      if (fullResult && fullResult.confidence !== "none" && fullResult.translation) {
        // Skip if same translation as last time (gesture unchanged)
        if (fullResult.translation !== lastTranslationRef.current) {
          lastTranslationRef.current = fullResult.translation;
          setCurrentTranslation(fullResult.translation);
          setFullSentence(fullResult.full_sentence || fullResult.translation);
          setSignLanguage(fullResult.sign_language);
          setConfidence(fullResult.confidence);

          setHistory((prev) => [...prev, {
            translation: fullResult.translation,
            sign_language: fullResult.sign_language,
            full_sentence: fullResult.full_sentence,
            confidence: fullResult.confidence,
            timestamp: Date.now(),
          }]);

          // Auto-save to persistent history
          onTranslationRef.current?.(fullResult.translation, fullResult.sign_language);
        }
      }

      // Track response time for adaptive rate
      const elapsed = Date.now() - startTime;
      responseTimesRef.current = [...responseTimesRef.current.slice(-4), elapsed];

    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setStreamingText("");
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [captureFrame]);

  // Adaptive interval — use average response time to avoid overlapping
  const getAdaptiveInterval = useCallback(() => {
    const times = responseTimesRef.current;
    if (times.length === 0) return captureInterval;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    // Interval should be at least avg response time + 500ms buffer
    return Math.max(captureInterval, avg + 500);
  }, [captureInterval]);

  // Auto-capture loop with adaptive timing
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const initialTimeout = setTimeout(translate, 800);

    // Use adaptive interval
    const tick = () => {
      translate();
      // Schedule next with adaptive timing
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(translate, getAdaptiveInterval());
    };

    intervalRef.current = setInterval(tick, getAdaptiveInterval());

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, translate, getAdaptiveInterval]);

  const clearAll = useCallback(() => {
    setCurrentTranslation("");
    setFullSentence("");
    setSignLanguage("");
    setConfidence("");
    setStreamingText("");
    setHistory([]);
    historyRef.current = [];
    lastTranslationRef.current = "";
    responseTimesRef.current = [];
    setError(null);
  }, []);

  return {
    currentTranslation,
    fullSentence,
    signLanguage,
    confidence,
    isProcessing,
    streamingText,
    error,
    history,
    clearAll,
    manualCapture: translate,
  };
}
