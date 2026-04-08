export interface HistoryEntry {
  id: string;
  text: string;
  category: "needs" | "social";
  source: "tile" | "gesture" | "typed" | "voice";
  spokenAt: string;
  favorited: boolean;
}

export type FilterPeriod = "today" | "yesterday" | "last-week" | "all";
