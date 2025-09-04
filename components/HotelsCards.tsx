"use client";
import React from "react";

type Hotel = {
  name?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  address?: string;
  maps_url?: string;
  place_id?: string;
  bcsScore?: number; // reserved for future re-rank
};

function gmapsPlaceUrl(place_id?: string) {
  if (!place_id) return null;
  return `https://www.google.com/maps/place/?q=place_id:${place_id}`;
}

export default function HotelsCards({ items }: { items: Hotel[] }) {
  if (!items?.length) return null;

  const fmtPL = (pl?: number) =>
    typeof pl === "number" ? "$".repeat(Math.max(0, Math.min(4, pl))) : "—";

  const sorted = [...items].sort(
    (a, b) =>
      (b.rating ?? 0) - (a.rating ?? 0) ||
      (a.price_level ?? 9) - (b.price_level ?? 9)
  );

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {sorted.map((h, idx) => {
        const url = h.maps_url || gmapsPlaceUrl(h.place_id) || "#";
        return (
          <div
            key={`${h.place_id || h.name || idx}`}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{h.name || "Hotel"}</h3>
                <p className="text-xs text-gray-500">{h.address || ""}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {h.rating?.toFixed(1) ?? "—"} ⭐
                </div>
                <div className="text-[10px] text-gray-500">
                  {h.user_ratings_total ? `(${h.user_ratings_total})` : ""}
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              <span className="rounded-md bg-gray-100 px-2 py-1">Price {fmtPL(h.price_level)}</span>
              {typeof h.bcsScore === "number" && (
                <span className="rounded-md bg-indigo-50 px-2 py-1 text-indigo-700">
                  BCS {Math.round(h.bcsScore)}
                </span>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <a
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-lg border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Open in Google Maps
              </a>
              {/* Placeholder for "Add to Itinerary" */}
              <button
                type="button"
                className="rounded-lg border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                disabled
                title="Coming soon"
              >
                Add to itinerary
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}