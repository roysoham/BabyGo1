// components/ResultsHeader.tsx
"use client";

import React from "react";

export default function ResultsHeader({
  title,
  subtitle,
  gmapsUrl,
}: {
  title: string;
  subtitle: string;
  gmapsUrl?: string | null;
}) {
  return (
    <header className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        {gmapsUrl ? (
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Open in Google Maps
          </a>
        ) : null}
      </div>
    </header>
  );
}