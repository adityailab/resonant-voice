"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <TopBar />
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="flex flex-col items-center gap-3 px-6 py-4 bg-neutral-50 text-xs text-neutral-400 mt-auto">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-500 uppercase tracking-wider">
              Powered by
            </span>
            <span className="px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-[11px] font-bold">
              Gemma 3 27B Vision
            </span>
            <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-[11px] font-bold">
              Multi-Language
            </span>
            <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full text-[11px] font-bold">
              Real-Time
            </span>
          </div>
          <div className="flex items-center gap-8">
            <span className="font-medium text-neutral-500">
              &copy; 2024 Resonant Architecture. Gemma AI Powered.
            </span>
            <div className="flex items-center gap-6">
              <a
                className="hover:underline text-blue-800 transition-colors"
                href="#"
              >
                Accessibility Guide
              </a>
              <a
                className="hover:underline text-blue-800 transition-colors"
                href="#"
              >
                Support
              </a>
            </div>
          </div>
        </footer>
      </main>
      <BottomNav />
    </div>
  );
}
