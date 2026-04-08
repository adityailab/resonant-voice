"use client";

import { usePhrases } from "@/hooks/usePhrases";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useHistory } from "@/hooks/useHistory";
import { useState } from "react";

export default function LibraryPage() {
  const { phrases, createPhrase } = usePhrases();
  const { speak } = useTextToSpeech();
  const { addEntry } = useHistory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhrase, setNewPhrase] = useState({ text: "", icon: "star", category: "custom" });

  const needsPhrases = phrases.filter((p) => p.category === "needs");
  const socialPhrases = phrases.filter((p) => p.category === "social");

  const handlePhraseClick = async (text: string, category: string) => {
    speak(text);
    await addEntry({ text, category, source: "tile" });
  };

  const handleAddPhrase = async () => {
    if (!newPhrase.text.trim()) return;
    await createPhrase({
      text: newPhrase.text,
      icon: newPhrase.icon,
      category: newPhrase.category as "needs" | "social" | "custom",
      isCustom: true,
    });
    setNewPhrase({ text: "", icon: "star", category: "custom" });
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface-container-low">
      <main className="p-8 max-w-6xl mx-auto">
        {/* Hero Header */}
        <header className="mb-12">
          <h2 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">
            Communication Library
          </h2>
          <p className="text-lg text-on-surface-variant max-w-2xl">
            Access your saved personal lexicon, curated needs, and intuitive
            gestures.
          </p>
        </header>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Daily Needs */}
          <section className="md:col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  star
                </span>
                Daily Needs
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {needsPhrases.slice(0, 4).map((phrase) => (
                <button
                  key={phrase.id}
                  onClick={() => handlePhraseClick(phrase.text, phrase.category)}
                  className="flex flex-col p-6 bg-surface-container-lowest rounded-xl ambient-shadow active:bg-primary-fixed transition-all text-left"
                >
                  <span className="material-symbols-outlined text-secondary mb-4 text-3xl">
                    {phrase.icon}
                  </span>
                  <span className="text-2xl font-medium mb-1">
                    {phrase.text}
                  </span>
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                    Priority: {phrase.priority}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Social Section */}
          <section className="md:col-span-4 flex flex-col gap-6 bg-surface-container rounded-3xl p-6">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary">
                forum
              </span>
              Social
            </h3>
            <div className="flex flex-col gap-4">
              {socialPhrases.map((phrase) => (
                <button
                  key={phrase.id}
                  onClick={() => handlePhraseClick(phrase.text, phrase.category)}
                  className="w-full p-4 bg-surface-container-lowest rounded-xl flex items-center gap-4 active:bg-primary-fixed transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary">
                      {phrase.icon}
                    </span>
                  </div>
                  <span className="font-medium">{phrase.text}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Custom Signs Section */}
          <section className="md:col-span-12 mt-8">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold">
                Custom Signs &amp; Symbols
              </h3>
              <div className="h-[1px] flex-1 bg-outline-variant opacity-20" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
              {phrases
                .filter((p) => p.isCustom)
                .map((phrase) => (
                  <button
                    key={phrase.id}
                    onClick={() =>
                      handlePhraseClick(phrase.text, phrase.category)
                    }
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center border-2 border-transparent hover:border-primary transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-4xl text-primary">
                        {phrase.icon}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{phrase.text}</span>
                  </button>
                ))}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center border-2 border-transparent hover:border-primary transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-outline text-4xl">
                    add
                  </span>
                </div>
                <span className="text-sm font-medium text-primary">
                  Add New
                </span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Add Phrase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface-container-lowest rounded-2xl p-8 max-w-md w-full mx-4 ambient-shadow">
            <h3 className="text-2xl font-bold mb-6">Add New Phrase</h3>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={newPhrase.text}
                onChange={(e) =>
                  setNewPhrase({ ...newPhrase, text: e.target.value })
                }
                placeholder="Enter phrase..."
                className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={newPhrase.category}
                onChange={(e) =>
                  setNewPhrase({ ...newPhrase, category: e.target.value })
                }
                className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="needs">Needs</option>
                <option value="social">Social</option>
                <option value="custom">Custom</option>
              </select>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-surface-container-high rounded-xl font-medium hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPhrase}
                  className="flex-1 px-4 py-3 hero-gradient text-on-primary rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  Add Phrase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 signature-gradient text-on-primary w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-50"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}
