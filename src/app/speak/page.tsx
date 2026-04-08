"use client";

import { useAppStore } from "@/stores/app-store";
import { usePhrases } from "@/hooks/usePhrases";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useHistory } from "@/hooks/useHistory";
import { useState, useCallback } from "react";
import type { Phrase } from "@/types/phrase";
import Link from "next/link";

const DASHBOARD_TILES = [
  { text: "Need Water", icon: "water_drop", iconColor: "text-secondary", bgColor: "bg-secondary-fixed", category: "needs" },
  { text: "Feeling Hungry", icon: "restaurant", iconColor: "text-secondary", bgColor: "bg-secondary-fixed", category: "needs" },
  { text: "Bathroom", icon: "wc", iconColor: "text-secondary", bgColor: "bg-secondary-fixed", category: "needs" },
  { text: "Happy", icon: "sentiment_very_satisfied", iconColor: "text-tertiary", bgColor: "bg-tertiary-fixed", category: "social" },
  { text: "Please Repeat", icon: "replay", iconColor: "text-on-surface-variant", bgColor: "bg-surface-container-high", category: "needs" },
  { text: "Help", icon: "emergency", iconColor: "text-error", bgColor: "bg-on-error", isEmergency: true, category: "needs" },
  { text: "Medicine", icon: "medical_services", iconColor: "text-secondary", bgColor: "bg-secondary-fixed", category: "needs" },
  { text: "Tired", icon: "bedtime", iconColor: "text-on-surface-variant", bgColor: "bg-surface-container-high", category: "needs" },
];

export default function SpeakPage() {
  const { selectedTiles, addTile, removeTile, clearSentence } = useAppStore();
  const { phrases } = usePhrases();
  const { speak, isSpeaking } = useTextToSpeech();
  const { addEntry } = useHistory();
  const [isListening, setIsListening] = useState(false);

  const handleTileClick = useCallback(
    (tile: (typeof DASHBOARD_TILES)[number]) => {
      const phrase: Phrase = {
        id: `tile-${Date.now()}-${Math.random()}`,
        text: tile.text,
        icon: tile.icon,
        category: tile.category as "needs" | "social" | "custom",
        priority: "medium",
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addTile(phrase);
    },
    [addTile]
  );

  const handleSpeak = useCallback(async () => {
    if (selectedTiles.length === 0) return;
    const sentence = selectedTiles.map((t) => t.text).join(". ");
    speak(sentence);
    await addEntry({
      text: sentence,
      category: selectedTiles[0].category,
      source: "tile",
    });
    clearSentence();
  }, [selectedTiles, speak, addEntry, clearSentence]);

  const handleSuggestion = useCallback(
    (text: string) => {
      const phrase: Phrase = {
        id: `sug-${Date.now()}`,
        text,
        icon: "auto_awesome",
        category: "social",
        priority: "medium",
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addTile(phrase);
    },
    [addTile]
  );

  const handleMic = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      return;
    }

    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition ||
      (window as unknown as Record<string, unknown>).SpeechRecognition;
    const recognition = new (SpeechRecognition as new () => SpeechRecognition)();

    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      const phrase: Phrase = {
        id: `voice-${Date.now()}`,
        text: transcript,
        icon: "mic",
        category: "social",
        priority: "medium",
        isCustom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addTile(phrase);
    };

    recognition.start();
  }, [addTile]);

  return (
    <div className="p-6 md:p-10 flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Output Display Section */}
      <section className="w-full">
        <div className="bg-surface-container-low rounded-xl p-8 ambient-shadow relative overflow-hidden min-h-[160px] flex flex-col justify-center">
          {/* Predictive Text Chips */}
          <div className="absolute top-4 right-6 flex gap-2">
            <button
              onClick={() => handleSuggestion("I would like")}
              className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full text-xs font-medium hover:bg-secondary-fixed-dim transition-colors"
            >
              Suggestion: I would like
            </button>
            <button
              onClick={() => handleSuggestion("Thank you")}
              className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full text-xs font-medium hover:bg-secondary-fixed-dim transition-colors"
            >
              Suggestion: Thank you
            </button>
          </div>

          <h2 className="text-on-surface-variant text-sm font-medium mb-4 tracking-widest uppercase">
            Visual Sentence Builder
          </h2>

          <div className="flex flex-wrap items-center gap-4">
            {selectedTiles.map((tile, i) => (
              <button
                key={tile.id + i}
                onClick={() => removeTile(tile.id)}
                className="px-6 py-4 bg-surface-container-lowest rounded-xl ambient-shadow flex items-center gap-3 border border-primary/10 hover:border-error/30 transition-colors group"
              >
                <span
                  className="material-symbols-outlined text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {tile.icon}
                </span>
                <span className="text-2xl font-semibold text-on-surface">
                  {tile.text}
                </span>
                <span className="material-symbols-outlined text-error opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                  close
                </span>
              </button>
            ))}

            {selectedTiles.length === 0 && (
              <span className="text-2xl text-on-surface opacity-30 italic font-light">
                Tap tiles below to build a sentence...
              </span>
            )}

            {selectedTiles.length > 0 && (
              <>
                <div className="w-1 h-8 bg-outline-variant opacity-30 rounded-full mx-2" />
                <span className="text-on-surface opacity-30 italic font-light">
                  Continue building...
                </span>
              </>
            )}
          </div>

          {selectedTiles.length > 0 && (
            <div className="absolute bottom-0 right-0 p-4">
              <button
                onClick={handleSpeak}
                disabled={isSpeaking}
                className="hero-gradient text-on-primary px-10 py-5 rounded-full flex items-center gap-3 hover:opacity-90 transition-all active:scale-95 shadow-xl disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-3xl">
                  translate
                </span>
                <span className="text-xl font-bold tracking-tight">
                  {isSpeaking ? "Speaking..." : "Translate & Speak"}
                </span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Frequent Needs Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="col-span-full mb-2">
          <h3 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Frequent Needs
          </h3>
        </div>
        {DASHBOARD_TILES.map((tile) => (
          <button
            key={tile.text}
            onClick={() => handleTileClick(tile)}
            className={`${
              tile.isEmergency
                ? "bg-error-container"
                : "bg-surface-container-lowest"
            } p-8 rounded-xl ambient-shadow flex flex-col items-center justify-center gap-6 group hover:bg-primary-fixed transition-all duration-300 border border-transparent hover:border-primary/20 active:scale-95`}
          >
            <div
              className={`w-20 h-20 ${tile.bgColor} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}
            >
              <span
                className={`material-symbols-outlined text-5xl ${tile.iconColor}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {tile.icon}
              </span>
            </div>
            <span
              className={`text-xl font-bold ${
                tile.isEmergency ? "text-on-error-container" : "text-on-surface"
              }`}
            >
              {tile.text}
            </span>
          </button>
        ))}
      </section>

      {/* Quick Access Bento Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="md:col-span-2 bg-primary-container text-on-primary-container p-10 rounded-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-2xl font-bold mb-2">Saved Phrases</h4>
            <p className="opacity-80">
              Quickly access your most frequent conversations.
            </p>
          </div>
          <div className="flex gap-3 mt-8 relative z-10">
            <button
              onClick={() => handleSuggestion("Good Morning")}
              className="bg-on-primary-container text-primary-container px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              &ldquo;Good Morning&rdquo;
            </button>
            <button
              onClick={() => handleSuggestion("Thank you")}
              className="bg-on-primary-container text-primary-container px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              &ldquo;Thank you&rdquo;
            </button>
          </div>
          <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[120px] opacity-10 rotate-12">
            auto_awesome
          </span>
        </div>
        <Link
          href="/history"
          className="bg-surface-container-high p-8 rounded-xl flex flex-col items-center justify-center text-center gap-4 border border-transparent hover:border-primary/10 transition-all"
        >
          <span className="material-symbols-outlined text-4xl text-primary">
            history
          </span>
          <span className="font-bold">Recent Conversations</span>
        </Link>
        <Link
          href="/gesture"
          className="bg-surface-container-high p-8 rounded-xl flex flex-col items-center justify-center text-center gap-4 border border-transparent hover:border-primary/10 transition-all"
        >
          <span className="material-symbols-outlined text-4xl text-primary">
            gesture
          </span>
          <span className="font-bold">Gesture to Speak</span>
        </Link>
      </section>

      {/* Floating Mic Button */}
      <button
        onClick={handleMic}
        className="fixed bottom-8 right-8 w-20 h-20 rounded-full hero-gradient text-white flex items-center justify-center ambient-shadow hover:scale-105 active:scale-95 transition-all z-50"
      >
        {isListening && (
          <div className="absolute inset-0 rounded-full bg-tertiary-container animate-ping opacity-20" />
        )}
        <span
          className="material-symbols-outlined text-4xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isListening ? "hearing" : "mic"}
        </span>
      </button>
    </div>
  );
}

// Extend Window for SpeechRecognition
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
