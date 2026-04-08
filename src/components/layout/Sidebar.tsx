"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/speak", icon: "record_voice_over", label: "Speak" },
  { href: "/gesture", icon: "gesture", label: "Translate" },
  { href: "/history", icon: "history", label: "History" },
  { href: "/library", icon: "grid_view", label: "Library" },
  { href: "/emergency", icon: "emergency", label: "Emergency" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-full w-64 bg-slate-50 fixed left-0 top-0 bottom-0 p-4 gap-4 z-50">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-black text-blue-900">Gemma AI</h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
          <span className="text-[10px] text-on-surface-variant opacity-70">
            Model: Ready
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 transition-all active:scale-95 ${
                isActive
                  ? "bg-blue-100 text-blue-900 rounded-xl font-semibold"
                  : "text-neutral-600 hover:text-blue-700 hover:bg-blue-50"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <div className="p-4 rounded-xl bg-surface-container-low">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Voice: Neutral Female (US)
          </p>
          <div className="h-1 w-full bg-surface-container-high rounded-full mt-2 overflow-hidden">
            <div className="h-full w-3/4 bg-primary rounded-full" />
          </div>
        </div>
      </div>
    </aside>
  );
}
