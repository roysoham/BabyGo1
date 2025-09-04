"use client";
import { useMemo, useState } from "react";

type Hotel = {
  name: string;
  address?: string;
  rating?: number;
  ratings?: number;
  maps_url?: string;
  place_id?: string;
  hints?: { likelyCribs?: boolean };
};

export default function HotelsList({
  items,
  coords
}: {
  items: Hotel[];
  coords?: { lat: number; lng: number } | null;
}) {
  const [keyword, setKeyword] = useState("");
  const [minRating, setMinRating] = useState(4.0);
  const [radiusKm, setRadiusKm] = useState(5);
  const [cribsOnly, setCribsOnly] = useState(false);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return (items || []).filter((h) => {
      if (!h) return false;
      if (cribsOnly && !h?.hints?.likelyCribs) return false;
      if (typeof h.rating === "number" && h.rating < minRating) return false;
      if (kw) {
        const hay = `${h.name || ""} ${h.address || ""}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [items, keyword, minRating, cribsOnly]);

  function openMaps(placeUrl?: string) {
    if (placeUrl) {
      window.open(placeUrl, "_blank", "noopener,noreferrer");
    } else if (coords) {
      const u = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
      window.open(u, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="space-y-3">
      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Keyword (e.g., kids, crib, quiet)"
          className="w-56 rounded-lg border px-3 py-2"
        />
        <label className="text-sm flex items-center gap-2">
          Min rating
          <select
            className="rounded-lg border px-2 py-2"
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
          >
            {[3, 3.5, 4, 4.5].map((r) => (
              <option key={r} value={r}>
                {r}★
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm flex items-center gap-2">
          Radius
          <select
            className="rounded-lg border px-2 py-2"
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value || "5"))}
          >
            {[3, 5, 8, 10, 15].map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={cribsOnly}
            onChange={(e) => setCribsOnly(e.target.checked)}
          />{" "}
          Cribs likely
        </label>
        <div className="ml-auto">
          <button
            className="rounded-lg border px-3 py-2 text-sm"
            onClick={() => {
              setKeyword("");
              setMinRating(4.0);
              setRadiusKm(5);
              setCribsOnly(false);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border p-6 text-gray-600">
          No hotels match your filters.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {filtered.map((h, i) => (
            <div
              key={`${h.place_id || h.name}-${i}`}
              className="rounded-2xl border p-4 shadow-sm"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <h3 className="line-clamp-1 font-semibold">{h.name}</h3>
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
                  ⭐ {typeof h.rating === "number" ? h.rating.toFixed(1) : "—"}{" "}
                  <span className="text-gray-500">
                    ({h.ratings ?? "—"})
                  </span>
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-gray-600">
                {h.address || "—"}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {h?.hints?.likelyCribs ? "Match: Cribs" : "Match: Kids"}
                </span>
                <button
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
                  onClick={() => openMaps(h.maps_url)}
                >
                  Open in Google Maps
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
