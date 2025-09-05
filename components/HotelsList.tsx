// components/HotelsList.tsx
"use client";

import React from "react";

function Badge({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
    >
      {children}
    </span>
  );
}

function Rating({ score, count }: { score?: number; count?: number }) {
  if (!score) return null;
  return (
    <Badge title="User rating">
      <span className="mr-1">⭐</span>
      {score.toFixed(1)}
      {count ? <span className="ml-1 text-gray-500">({count})</span> : null}
    </Badge>
  );
}

export default function HotelsList({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-gray-600">
        No hotels found for this destination yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((h, i) => {
        const mapUrl = h.location
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              h.location
            )}`
          : h.gmaps || null;

        const matchChips: string[] = [];
        if (h.matches?.cribs) matchChips.push("Cribs");
        if (h.matches?.kids) matchChips.push("Kids");
        if (h.matches?.quiet) matchChips.push("Quiet");

        return (
          <article
            key={h.id || `${h.name}-${i}`}
            className="relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm"
            style={{
              background:
                "linear-gradient(90deg, rgba(99,102,241,0.12), rgba(34,211,238,0.12))",
            }}
          >
            <div className="rounded-2xl bg-white p-3">
              <div className="flex items-start justify-between">
                <h3 className="line-clamp-1 text-lg font-semibold">
                  {h.name || "Unnamed hotel"}
                </h3>
                <Rating score={h.rating} count={h.user_ratings_total} />
              </div>

              <p className="mt-1 line-clamp-1 text-sm text-gray-600">
                {h.vicinity || h.address || h.location || ""}
              </p>

              {matchChips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {matchChips.map((m) => (
                    <Badge key={m}>Match: {m}</Badge>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    Open in Google Maps
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}