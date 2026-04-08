"use client";

import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useHistory } from "@/hooks/useHistory";
import { useEffect, useState } from "react";

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  photoUrl: string | null;
  isPrimary: boolean;
}

export default function EmergencyPage() {
  const { speak } = useTextToSpeech();
  const { addEntry } = useHistory();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    fetch("/api/emergency-contacts")
      .then((r) => r.json())
      .then(setContacts);
  }, []);

  const handleEmergency = async (text: string) => {
    speak(text);
    await addEntry({ text, category: "needs", source: "tile" });
  };

  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  return (
    <div className="p-6 md:p-12 flex-1 flex flex-col gap-8">
      {/* Hero Header */}
      <div className="mb-4">
        <h2 className="text-5xl font-black text-on-surface mb-2 tracking-tight">
          Emergency Board
        </h2>
        <p className="text-xl text-on-surface-variant font-medium">
          Tap to communicate vital needs immediately.
        </p>
      </div>

      {/* Urgent Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* HELP */}
        <button
          onClick={() => handleEmergency("HELP! I need immediate assistance!")}
          className="md:col-span-2 group relative overflow-hidden bg-error text-on-error rounded-xl p-8 flex flex-col justify-between items-start transition-all active:scale-95 emergency-pulse min-h-[280px] hover:bg-red-800 duration-200"
        >
          <span
            className="material-symbols-outlined text-7xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            emergency
          </span>
          <div className="text-left">
            <span className="text-7xl font-black block leading-none">HELP</span>
            <span className="text-xl font-medium opacity-90 mt-2 block">
              Trigger global emergency alert
            </span>
          </div>
        </button>

        {/* Medical */}
        <button
          onClick={() => handleEmergency("I need medical attention. Please call a doctor.")}
          className="bg-secondary text-on-secondary rounded-xl p-8 flex flex-col justify-between items-start transition-all active:scale-95 min-h-[280px] hover:bg-orange-800 duration-200"
        >
          <span
            className="material-symbols-outlined text-6xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            medical_services
          </span>
          <div className="text-left">
            <span className="text-4xl font-black block leading-tight">
              Medical
              <br />
              Need
            </span>
            <span className="text-lg font-medium opacity-90 mt-2 block">
              I need a doctor
            </span>
          </div>
        </button>

        {/* YES / NO */}
        <div className="grid grid-cols-2 gap-6 md:col-span-3">
          <button
            onClick={() => handleEmergency("Yes")}
            className="bg-tertiary text-on-tertiary rounded-xl p-8 flex flex-col items-center justify-center transition-all active:scale-95 min-h-[200px] hover:bg-green-900 duration-200"
          >
            <span
              className="material-symbols-outlined text-6xl mb-4"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <span className="text-5xl font-black">YES</span>
          </button>
          <button
            onClick={() => handleEmergency("No")}
            className="bg-on-surface text-surface rounded-xl p-8 flex flex-col items-center justify-center transition-all active:scale-95 min-h-[200px] hover:bg-neutral-800 duration-200"
          >
            <span
              className="material-symbols-outlined text-6xl mb-4"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              cancel
            </span>
            <span className="text-5xl font-black">NO</span>
          </button>
        </div>

        {/* Secondary Needs */}
        <button
          onClick={() => handleEmergency("I need water. I am thirsty.")}
          className="bg-surface-container-low text-on-surface rounded-xl p-8 flex flex-col justify-between items-start transition-all active:scale-95 hover:bg-surface-container-high min-h-[240px]"
        >
          <span
            className="material-symbols-outlined text-5xl text-secondary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            water_drop
          </span>
          <div>
            <span className="text-3xl font-bold block">Water</span>
            <span className="text-sm font-medium text-on-surface-variant">
              Thirsty
            </span>
          </div>
        </button>

        <button
          onClick={() => handleEmergency("I need food. I am hungry.")}
          className="bg-surface-container-low text-on-surface rounded-xl p-8 flex flex-col justify-between items-start transition-all active:scale-95 hover:bg-surface-container-high min-h-[240px]"
        >
          <span
            className="material-symbols-outlined text-5xl text-secondary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            restaurant
          </span>
          <div>
            <span className="text-3xl font-bold block">Food</span>
            <span className="text-sm font-medium text-on-surface-variant">
              Hungry
            </span>
          </div>
        </button>

        <button
          onClick={() => handleEmergency("Please call my care assistant.")}
          className="bg-surface-container-low text-on-surface rounded-xl p-8 flex flex-col justify-between items-start transition-all active:scale-95 hover:bg-surface-container-high min-h-[240px]"
        >
          <span
            className="material-symbols-outlined text-5xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            person_alert
          </span>
          <div>
            <span className="text-3xl font-bold block">Call Care</span>
            <span className="text-sm font-medium text-on-surface-variant">
              Notify assistant
            </span>
          </div>
        </button>
      </div>

      {/* Emergency Contact Card */}
      {primaryContact && (
        <div className="mt-8 p-8 rounded-2xl bg-primary text-on-primary relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-on-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-on-primary">
                  person
                </span>
              </div>
              <div>
                <p className="text-sm opacity-80 font-medium uppercase tracking-widest">
                  Primary Emergency Contact
                </p>
                <h3 className="text-3xl font-bold">
                  {primaryContact.name} ({primaryContact.role})
                </h3>
                <p className="text-xl opacity-90">{primaryContact.phone}</p>
              </div>
            </div>
            <a
              href={`tel:${primaryContact.phone.replace(/[^+\d]/g, "")}`}
              className="bg-on-primary text-primary px-10 py-5 rounded-full font-black text-xl hover:bg-primary-fixed transition-all active:scale-98 flex items-center gap-3"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                call
              </span>
              DIAL NOW
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
