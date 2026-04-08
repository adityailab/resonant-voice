"use client";

import { useTheme } from "@/hooks/useTheme";

export function TopBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex justify-between items-center px-6 py-4 w-full bg-slate-50 dark:bg-slate-900 text-sm font-medium sticky top-0 z-40 relative">
      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">Resonant Voice</div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-90"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          <span className="material-symbols-outlined text-blue-800 dark:text-blue-400">
            {theme === "light" ? "dark_mode" : "light_mode"}
          </span>
        </button>
        <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-90">
          <span className="material-symbols-outlined text-blue-800 dark:text-blue-400">
            settings
          </span>
        </button>
        <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-90">
          <span className="material-symbols-outlined text-blue-800 dark:text-blue-400">
            account_circle
          </span>
        </button>
      </div>
      <div className="absolute bottom-0 left-0 bg-neutral-200/50 dark:bg-neutral-700/50 h-[1px] w-full" />
    </header>
  );
}
