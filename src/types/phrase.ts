export interface Phrase {
  id: string;
  text: string;
  icon: string;
  category: "needs" | "social" | "custom";
  priority: "essential" | "high" | "medium" | "low";
  isCustom: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PhraseInput {
  text: string;
  icon: string;
  category: "needs" | "social" | "custom";
  priority?: "essential" | "high" | "medium" | "low";
  isCustom?: boolean;
  imageUrl?: string | null;
}
