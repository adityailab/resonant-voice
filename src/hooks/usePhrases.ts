import useSWR from "swr";
import type { Phrase, PhraseInput } from "@/types/phrase";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePhrases(category?: string) {
  const url = category ? `/api/phrases?category=${category}` : "/api/phrases";
  const { data, error, mutate } = useSWR<Phrase[]>(url, fetcher);

  const createPhrase = async (input: PhraseInput) => {
    const res = await fetch("/api/phrases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const phrase = await res.json();
    mutate();
    return phrase;
  };

  const deletePhrase = async (id: string) => {
    await fetch(`/api/phrases/${id}`, { method: "DELETE" });
    mutate();
  };

  return {
    phrases: data || [],
    isLoading: !error && !data,
    error,
    createPhrase,
    deletePhrase,
    mutate,
  };
}
