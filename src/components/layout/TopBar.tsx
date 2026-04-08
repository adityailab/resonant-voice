"use client";

export function TopBar() {
  return (
    <header className="flex justify-between items-center px-6 py-4 w-full bg-slate-50 text-sm font-medium sticky top-0 z-40 relative">
      <div className="text-2xl font-bold text-blue-900">Resonant Voice</div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-neutral-100 transition-colors active:scale-90">
          <span className="material-symbols-outlined text-blue-800">
            settings
          </span>
        </button>
        <button className="p-2 rounded-full hover:bg-neutral-100 transition-colors active:scale-90">
          <span className="material-symbols-outlined text-blue-800">
            account_circle
          </span>
        </button>
      </div>
      <div className="absolute bottom-0 left-0 bg-neutral-200/50 h-[1px] w-full" />
    </header>
  );
}
