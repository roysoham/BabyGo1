// components/KBInsights.tsx
"use client";

import React from "react";

// This import is optional. If the file doesn't exist, we guard below.
let CITY_DB: any[] = [];
try {
  // If you already have a path like "@/data/city_profiles.json", keep it.
  // Otherwise place the sample file from below in /data/city_profiles.json
  // and this will start working immediately.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  CITY_DB = require("@/data/city_profiles.json");
} catch {
  CITY_DB = [];
}

type KBInsightsProps = {
  city?: string | null;
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
      {children}
    </span>
  );
}

export default function KBInsights({ city }: KBInsightsProps) {
  const name = (city || "").toString().trim().toLowerCase();
  if (!name) return null;

  const rec =
    (CITY_DB || []).find((c: any) => {
      const n = (c?.name || "").toString().toLowerCase();
      return n === name || n.includes(name);
    }) || null;

  if (!rec) return null;

  const tags: string[] = Array.isArray(rec.tags) ? rec.tags : [];
  const notes: string[] = Array.isArray(rec.notes) ? rec.notes : [];
  const neighborhoods: string[] = Array.isArray(rec.neighborhoods)
    ? rec.neighborhoods
    : [];

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          City insights — {rec.name}
        </h3>
      </div>

      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      )}

      {neighborhoods.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-700">Areas to consider</p>
          <p className="text-xs text-gray-600">
            {neighborhoods.slice(0, 4).join(" • ")}
          </p>
        </div>
      )}

      {notes.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-gray-700">
          {notes.slice(0, 3).map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </section>
  );
}