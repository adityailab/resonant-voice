"use client";

import dynamic from "next/dynamic";

const GesturePageClient = dynamic(() => import("./GestureClient"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-on-surface-variant text-lg">Loading translator...</div>
    </div>
  ),
});

export default function GesturePage() {
  return <GesturePageClient />;
}
