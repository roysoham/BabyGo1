"use client";
import { useState } from "react";
type Tab = { key: string; label: string; content: React.ReactNode };
export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key || "");
  return (
    <div className="rounded-xl border bg-white">
      <div className="flex flex-wrap gap-2 border-b p-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)}
            className={`rounded-lg px-3 py-1 text-sm ${active === t.key ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tabs.find(t => t.key === active)?.content}
      </div>
    </div>
  );
}
