"use client";

import { useHistory } from "@/hooks/useHistory";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useAppStore } from "@/stores/app-store";
import type { FilterPeriod } from "@/types/history";

const FILTERS: { label: string; value: FilterPeriod }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last Week", value: "last-week" },
];

export default function HistoryPage() {
  const { historyFilter, setHistoryFilter } = useAppStore();
  const { entries } = useHistory(historyFilter);
  const { speak } = useTextToSpeech();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const groupByDate = (items: typeof entries) => {
    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date(today.getTime() - 86400000);
    const yesterdayStr = yesterday.toDateString();

    const groups: Record<string, typeof entries> = {};
    for (const entry of items) {
      const d = new Date(entry.spokenAt).toDateString();
      let label = d;
      if (d === todayStr) label = "Today";
      else if (d === yesterdayStr) label = "Yesterday";

      if (!groups[label]) groups[label] = [];
      groups[label].push(entry);
    }
    return groups;
  };

  const grouped = groupByDate(entries);

  return (
    <div className="flex-1 px-6 pb-20 min-h-screen">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-on-surface mb-2">
              Conversation History
            </h1>
            <p className="text-on-surface-variant font-medium">
              Review and replay your recent expressions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setHistoryFilter(f.value)}
                className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
                  historyFilter === f.value
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* History Cards */}
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(grouped).map(([label, items]) => (
            <section key={label}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-outline mb-4">
                {label}
              </h3>
              <div
                className={
                  label === "Today"
                    ? "space-y-6"
                    : "grid grid-cols-1 md:grid-cols-2 gap-6"
                }
              >
                {items.map((entry) => (
                  <div
                    key={entry.id}
                    className={`${
                      label === "Today"
                        ? "bg-surface-container-lowest rounded-xl p-6 ambient-shadow hover:shadow-lg"
                        : "bg-surface-container-low rounded-xl p-6 hover:bg-surface-container-high"
                    } transition-all`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold text-outline-variant uppercase">
                        {formatTime(entry.spokenAt)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => speak(entry.text)}
                          className="p-2 text-primary hover:bg-primary-fixed transition-colors rounded-full"
                          title="Replay"
                        >
                          <span className="material-symbols-outlined">
                            replay
                          </span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(entry.text)}
                          className="p-2 text-outline hover:bg-surface-container-high transition-colors rounded-full"
                          title="Copy"
                        >
                          <span className="material-symbols-outlined">
                            content_copy
                          </span>
                        </button>
                      </div>
                    </div>
                    <p
                      className={`${
                        label === "Today" ? "text-2xl" : "text-lg"
                      } font-medium text-on-surface leading-snug`}
                    >
                      &ldquo;{entry.text}&rdquo;
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          entry.category === "social"
                            ? "bg-tertiary-fixed text-on-tertiary-fixed"
                            : "bg-secondary-fixed text-on-secondary-fixed"
                        }`}
                      >
                        {entry.category}
                      </span>
                      {entry.favorited && (
                        <span
                          className="material-symbols-outlined text-primary text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          favorite
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">
                history
              </span>
              <p className="text-xl text-on-surface-variant">
                No conversation history yet.
              </p>
              <p className="text-on-surface-variant mt-2">
                Start speaking to build your history.
              </p>
            </div>
          )}
        </div>

        {/* Activity Insight Card */}
        {entries.length > 0 && (
          <section className="mt-8 mb-12">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-container p-8 text-on-primary">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h4 className="text-2xl font-bold mb-2">
                    Communication Pulse
                  </h4>
                  <p className="text-primary-fixed opacity-90 mb-6">
                    You&apos;ve expressed {entries.length} phrases in this
                    period. Keep communicating!
                  </p>
                  <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center min-w-[80px]">
                      <div className="text-xl font-bold">{entries.length}</div>
                      <div className="text-[10px] uppercase font-bold opacity-70">
                        Total
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-center min-w-[80px]">
                      <div className="text-xl font-bold">
                        {entries.filter((e) => e.category === "social").length}
                      </div>
                      <div className="text-[10px] uppercase font-bold opacity-70">
                        Social
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-64 h-40 bg-white/5 rounded-xl backdrop-blur-sm relative flex items-center justify-center border border-white/10">
                  <div className="absolute inset-0 opacity-20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-9xl">
                      insights
                    </span>
                  </div>
                  <div className="z-10 text-center">
                    <span className="text-sm font-bold uppercase tracking-tighter block mb-1">
                      Growth
                    </span>
                    <span className="text-4xl font-black">+15%</span>
                  </div>
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-secondary-container rounded-full blur-3xl opacity-20" />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
