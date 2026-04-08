import useSWR from "swr";
import type { HistoryEntry, FilterPeriod } from "@/types/history";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useHistory(period: FilterPeriod = "all") {
  const { data, error, mutate } = useSWR<HistoryEntry[]>(
    `/api/history?period=${period}`,
    fetcher
  );

  const addEntry = async (entry: {
    text: string;
    category: string;
    source: string;
  }) => {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    const newEntry = await res.json();
    mutate();
    return newEntry;
  };

  return {
    entries: data || [],
    isLoading: !error && !data,
    error,
    addEntry,
    mutate,
  };
}
