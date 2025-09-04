"use client";
import React, { useEffect, useRef, useState } from "react";
import Chip from "@/components/ui/Chip";
import HotelsCards from "@/components/HotelsCards";

type Suggestion = { place_id: string; description: string };

function useDebounced<T extends (...args: any[]) => void>(fn: T, delay = 220) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: Parameters<T>) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(...args), delay) as any;
  };
}

async function getSug(q: string): Promise<Suggestion[]> {
  if (!q || q.length < 2) return [];
  try {
    const r = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}`);
    if (!r.ok) return [];
    return await r.json();
  } catch {
    return [];
  }
}

async function resolveLatLng(placeId: string) {
  try {
    const r = await fetch(`/api/places/details?placeId=${encodeURIComponent(placeId)}`, { cache: "no-store" });
    if (!r.ok) return null;
    const d = await r.json();
    const loc = d?.result?.geometry?.location;
    return (typeof loc?.lat === "number" && typeof loc?.lng === "number") ? { lat: loc.lat, lng: loc.lng } : null;
  } catch {
    return null;
  }
}

async function loadHotels(
  coords: { lat: number; lng: number },
  f: { radius: number; limit: number; minRating?: number; maxPriceLevel?: number; keyword?: string; cribsLikely?: boolean }
) {
  const qs = new URLSearchParams({
    lat: String(coords.lat),
    lng: String(coords.lng),
    radius: String(f.radius),
    limit: String(f.limit),
  });
  if (f.minRating) qs.set("minRating", String(f.minRating));
  if (typeof f.maxPriceLevel === "number") qs.set("maxPriceLevel", String(f.maxPriceLevel));
  if (f.keyword?.trim()) qs.set("keyword", f.keyword.trim());
  if (f.cribsLikely) qs.set("cribsLikely", "true");

  const r = await fetch(`/api/hotels?${qs.toString()}`, { cache: "no-store" });
  if (!r.ok) return { items: [], debug: { apiTried: true, error: "api error" } };
  const data = await r.json();
  return data;
}

export default function HotelsTab() {
  // location state
  const [q, setQ] = useState("");
  const [openSug, setOpenSug] = useState(false);
  const [sug, setSug] = useState<Suggestion[]>([]);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // filters
  const [radius, setRadius] = useState(3500);
  const [limit, setLimit] = useState(12);
  const [minRating, setMinRating] = useState(4.5);
  const [maxPriceLevel, setMaxPriceLevel] = useState(3);
  const [keyword, setKeyword] = useState("");
  const [cribsLikely, setCribsLikely] = useState(true);

  // results
  const [items, setItems] = useState<any[]>([]);
  const [flags, setFlags] = useState<{ apiTried: boolean; source: "none" | "details" }>({
    apiTried: false,
    source: "none",
  });

  const deb = useDebounced(async (v: string) => setSug(await getSug(v)), 220);

  useEffect(() => {
    if (!openSug) return;
    deb(q);
  }, [q, openSug]);

  async function handlePick(s: Suggestion) {
    setQ(s.description);
    setPlaceId(s.place_id);
    setOpenSug(false);
    const ll = await resolveLatLng(s.place_id);
    setCoords(ll);
    setFlags((f) => ({ ...f, source: ll ? "details" : "none" }));
  }

  async function onSearch() {
    setItems([]);
    setFlags((f) => ({ ...f, apiTried: true }));
    if (!coords) return;
    const data = await loadHotels(coords, { radius, limit, minRating, maxPriceLevel, keyword, cribsLikely });
    const arr: any[] = Array.isArray(data?.items) ? data.items : [];
    setItems(arr);
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <label className="mb-1 block text-xs font-medium text-gray-600">Location</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Enter city / area"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPlaceId(null);
                setCoords(null);
              }}
              onFocus={() => setOpenSug(true)}
            />
            {openSug && sug.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white shadow">
                {sug.map((s) => (
                  <div
                    key={s.place_id}
                    className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => handlePick(s)}
                  >
                    {s.description}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">Radius (m)</label>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              value={radius}
              min={500}
              step={100}
              onChange={(e) => setRadius(parseInt(e.target.value || "3500", 10))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">Min rating</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
            >
              {[4.0, 4.2, 4.3, 4.4, 4.5].map((x) => (
                <option key={x} value={x}>
                  {x.toFixed(1)}+
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">Max price level</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={maxPriceLevel}
              onChange={(e) => setMaxPriceLevel(parseInt(e.target.value, 10))}
            >
              {[0, 1, 2, 3, 4].map((x) => (
                <option key={x} value={x}>
                  `$${"".padStart(x, "$")}`
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">Limit</label>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              value={limit}
              min={5}
              max={50}
              onChange={(e) => setLimit(parseInt(e.target.value || "12", 10))}
            />
          </div>

          <div className="md:col-span-8">
            <label className="mb-1 block text-xs font-medium text-gray-600">Keyword</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="kids, crib, family, station, park..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={cribsLikely}
                onChange={(e) => setCribsLikely(e.target.checked)}
              />
              Cribs likely
            </label>
          </div>

          <div className="md:col-span-2 flex items-end justify-end">
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
              onClick={onSearch}
              disabled={!coords}
              title={!coords ? "Pick a location first" : "Search hotels"}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        <Chip>{items.length ? `${items.length} result(s)` : "no results"}</Chip>
        <Chip>coords source: {flags.source}</Chip>
        <Chip>api tried: {String(flags.apiTried)}</Chip>
      </div>

      {/* Results */}
      {items.length ? (
        <HotelsCards items={items} />
      ) : flags.apiTried ? (
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          No hotels found for this search.
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-6 text-gray-500">
          Choose a location, adjust filters, then click Search.
        </div>
      )}
    </div>
  );
}