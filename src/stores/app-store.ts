import { create } from "zustand";
import type { Phrase } from "@/types/phrase";

interface AppState {
  // Sentence builder
  selectedTiles: Phrase[];
  addTile: (phrase: Phrase) => void;
  removeTile: (id: string) => void;
  clearSentence: () => void;

  // User preferences
  voiceId: string;
  speechRate: number;
  setVoice: (id: string) => void;
  setSpeechRate: (rate: number) => void;

  // Gesture recognition
  isGestureActive: boolean;
  currentGesture: string | null;
  translatedText: string;
  setGestureActive: (active: boolean) => void;
  setCurrentGesture: (gesture: string | null) => void;
  setTranslatedText: (text: string) => void;
  appendTranslatedText: (text: string) => void;
  clearTranslatedText: () => void;

  // History filters
  historyFilter: "today" | "yesterday" | "last-week" | "all";
  setHistoryFilter: (
    filter: "today" | "yesterday" | "last-week" | "all"
  ) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Sentence builder
  selectedTiles: [],
  addTile: (phrase) =>
    set((state) => ({ selectedTiles: [...state.selectedTiles, phrase] })),
  removeTile: (id) =>
    set((state) => ({
      selectedTiles: state.selectedTiles.filter((t) => t.id !== id),
    })),
  clearSentence: () => set({ selectedTiles: [] }),

  // User preferences
  voiceId: "default",
  speechRate: 1.0,
  setVoice: (id) => set({ voiceId: id }),
  setSpeechRate: (rate) => set({ speechRate: rate }),

  // Gesture recognition
  isGestureActive: false,
  currentGesture: null,
  translatedText: "",
  setGestureActive: (active) => set({ isGestureActive: active }),
  setCurrentGesture: (gesture) => set({ currentGesture: gesture }),
  setTranslatedText: (text) => set({ translatedText: text }),
  appendTranslatedText: (text) =>
    set((state) => ({
      translatedText: state.translatedText
        ? state.translatedText + " " + text
        : text,
    })),
  clearTranslatedText: () => set({ translatedText: "" }),

  // History filters
  historyFilter: "today",
  setHistoryFilter: (filter) => set({ historyFilter: filter }),
}));
