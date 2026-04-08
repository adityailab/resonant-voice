"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/speak", icon: "record_voice_over", label: "Speak" },
  { href: "/gesture", icon: "gesture", label: "Translate" },
  { href: "/library", icon: "grid_view", label: "Library" },
  { href: "/emergency", icon: "emergency", label: "Emergency" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-50 flex justify-around items-center py-3 px-2 z-50 border-t border-neutral-200">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 ${
              isActive ? "text-blue-700 font-bold" : "text-neutral-500"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={
                isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
              }
            >
              {item.icon}
            </span>
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
