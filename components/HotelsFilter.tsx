"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// tiny helper
const getOne = (sp: URLSearchParams, key: string, d = "") =>
  sp.getAll(key)[0] ?? d;

type Props = {
  initial: {
    location?: string;
    lat?: number;
    lng?: number;
    radius: number;
    minRating: number;
    price: number;
    limit: number;
    keyword?: string;
    cribs?: boolean;
  };
};

type Sug = { place_id: string; description: string };

export default function HotelsFilter({ initial }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // form state
  const [location, setLocation] = useState(initial.location ?? "");
  const [radius, setRadius] = useState<number>(initial.radius ?? 3500);
  const [minRating, setMinRating] = useState<number>(initial.minRating ?? 0);
  const [price, setPrice] = useState<number>(initial.price ?? 0);
  const [limit, setLimit] = useState<number>(initial.limit ?? 12);
  const [keyword, setKeyword] = useState(initial.keyword ?? "");
  const [cribs, setCribs] = useState<boolean>(!!initial.cribs);

  // coords (kept internally so we can safely search)
  const [lat, setLat] = useState<number | null>(
    typeof initial.lat === "number" ? initial.lat : null
  );
  const [lng, setLng] = useState<number | null>(
    typeof initial.lng === "number" ? initial.lng : null
  );

  // pick URL lat/lng if they exist
  useEffect(() => {
    const latQ = parseFloat(getOne(sp, "lat", ""));
    const lngQ = parseFloat(getOne(sp, "lng", ""));
    if (Number.isFinite(latQ) && Number.isFinite(lngQ)) {
      setLat(latQ);
      setLng(lngQ);
    } else {
      // seed location from URL if present
      const locQ = getOne(sp, "to", "");
      if (locQ && !location) setLocation(locQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- robust resolver: prefer local city coords, then autocomplete/details, but never block
  const resolveCoords = async (locText: string): Promise<{ lat: number; lng: number } | null> => {
    const t = (locText || "").toLowerCase().trim();
    if (!t) return null;

    // 1) local city table (fast, offline, reliable)
    try {
      const { default: cities } = await import("@/lib/fallbackCities");
      const hit =
        cities.find(c =>
          c.names.some(n => t.includes(n.toLowerCase()))
        ) || null;
      if (hit) return { lat: hit.lat, lng: hit.lng };
    } catch {
      /* ignore */
    }

    // 2) try your autocomplete + details (best-effort)
    try {
      const a = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(locText)}`, { cache: "no-store" });
      if (a.ok) {
        const arr: Sug[] = await a.json();
        if (arr?.length) {
          const pid = arr[0].place_id;
          const d = await fetch(`/api/places/details?placeId=${encodeURIComponent(pid)}`, { cache: "no-store" });
          if (d.ok) {
            const j = await d.json();
            const ll = j?.result?.geometry?.location;
            if (typeof ll?.lat === "number" && typeof ll?.lng === "number") {
              return { lat: ll.lat, lng: ll.lng };
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
    return null;
  };

  // --- submit
  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalLat = lat;
    let finalLng = lng;

    if (!(Number.isFinite(finalLat as number) && Number.isFinite(finalLng as number))) {
      const r = await resolveCoords(location);
      if (r) { finalLat = r.lat; finalLng = r.lng; }
    }
    if (!(Number.isFinite(finalLat as number) && Number.isFinite(finalLng as number))) {
      alert("Could not resolve destination coordinates. Try a major city name (e.g., “Paris, France”).");
      return;
    }

    const q = new URLSearchParams(sp?.toString() ?? "");
    q.set("to", location || getOne(sp, "to", "Destination"));
    q.set("lat", String(finalLat));
    q.set("lng", String(finalLng));
    q.set("radius", String(Math.max(500, radius | 0)));
    q.set("minRating", String(minRating || 0));
    q.set("price", String(price || 0));
    q.set("limit", String(Math.min(Math.max(1, limit | 0), 40)));
    q.set("keyword", keyword ?? "");
    q.set("cribs", String(!!cribs));

    router.push(`${pathname}?${q.toString()}`, { scroll: false });
  };

  const onReset = () => {
    setKeyword("");
    setCribs(false);
    setMinRating(0);
    setPrice(0);
    setRadius(3500);
    setLimit(12);
  };

  // simple options
  const minOptions = useMemo(() => [0, 3.5, 4.0, 4.5], []);
  const priceOptions = useMemo(() => [0, 1, 2, 3, 4, 5], []);

  return (
    <form onSubmit={onSearch} className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="grid gap-3 md:grid-cols-5">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Paris, France"
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Radius (m)</label>
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value || "0"))}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min rating</label>
          <select
            value={String(minRating)}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
          >
            {minOptions.map(v => (
              <option key={v} value={v}>{v === 0 ? "Any" : `${v}+`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max price level</label>
          <select
            value={String(price)}
            onChange={(e) => setPrice(parseInt(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
          >
            {priceOptions.map(v => (
              <option key={v} value={v}>{v === 0 ? "Any" : "$".repeat(v)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Limit</label>
          <input
            type="number"
            min={1}
            max={40}
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value || "12"))}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs text-gray-500 mb-1">Keyword</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="kids, crib, quiet"
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
        <label className="mt-6 inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cribs} onChange={(e) => setCribs(e.target.checked)} />
          Cribs likely
        </label>
      </div>
      <div className="mt-3 flex gap-3">
        <button type="submit" className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2 font-semibold text-white">
          Search
        </button>
        <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2">
          Reset
        </button>
      </div>
    </form>
  );
}