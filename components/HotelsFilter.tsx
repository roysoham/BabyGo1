// components/HotelsFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Init = {
  locationText: string;
  lat: number | null;
  lng: number | null;
  radius: number;
  limit: number;
  keyword: string;
  cribsLikely: boolean;
};

async function resolveLatLngFromText(q: string) {
  if (!q.trim()) return null;
  try {
    const ac = await fetch(
      `/api/places/autocomplete?q=${encodeURIComponent(q)}`
    );
    if (!ac.ok) return null;
    const list = await ac.json();
    const pid = list?.[0]?.place_id;
    if (!pid) return null;
    const det = await fetch(
      `/api/places/details?placeId=${encodeURIComponent(pid)}`
    );
    if (!det.ok) return null;
    const js = await det.json();
    const loc = js?.result?.geometry?.location;
    if (typeof loc?.lat === "number" && typeof loc?.lng === "number") {
      return { lat: loc.lat, lng: loc.lng, toId: pid, toText: list?.[0]?.description ?? q };
    }
    return null;
  } catch {
    return null;
  }
}

export default function HotelsFilter({ initial }: { initial: Init }) {
  const router = useRouter();
  const sp = useSearchParams();

  // state
  const [locationText, setLocationText] = useState(initial.locationText);
  const [radius, setRadius] = useState(initial.radius);
  const [limit, setLimit] = useState(initial.limit);
  const [keyword, setKeyword] = useState(initial.keyword);
  const [cribsLikely, setCribsLikely] = useState(initial.cribsLikely);
  const [busy, setBusy] = useState(false);

  // keep URL base params (itinerary context)
  const baseParams = useMemo(() => {
    const keep = ["from", "to", "toId", "depart", "ret", "childAge", "travellers", "directOnly"];
    const out = new URLSearchParams();
    keep.forEach((k) => {
      const v = sp.get(k);
      if (v != null) out.set(k, v);
    });
    return out;
  }, [sp]);

  const onSearch = useCallback(async () => {
    setBusy(true);
    try {
      let lat = initial.lat;
      let lng = initial.lng;
      let toId = sp.get("toId") || undefined;
      let toText = locationText;

      // if no coords, resolve from text
      if (!(typeof lat === "number" && typeof lng === "number")) {
        const res = await resolveLatLngFromText(locationText);
        if (res) {
          lat = res.lat;
          lng = res.lng;
          toId = res.toId;
          toText = res.toText;
        }
      }

      const qs = new URLSearchParams(baseParams);
      if (toText) qs.set("to", toText);
      if (toId) qs.set("toId", toId);
      if (typeof lat === "number" && typeof lng === "number") {
        qs.set("lat", String(lat));
        qs.set("lng", String(lng));
      }
      qs.set("radius", String(radius));
      qs.set("limit", String(limit));
      if (keyword) qs.set("keyword", keyword);
      qs.set("cribs", String(cribsLikely));

      router.push(`/results?${qs.toString()}`);
    } finally {
      setBusy(false);
    }
  }, [baseParams, cribsLikely, keyword, limit, locationText, radius, router, sp, initial.lat, initial.lng]);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Location
          </label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="City or place"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Radius (m)
          </label>
          <input
            type="number"
            className="w-full rounded-lg border px-3 py-2"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value || "0"))}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Limit
          </label>
          <input
            type="number"
            className="w-full rounded-lg border px-3 py-2"
            value={limit}
            min={1}
            max={50}
            onChange={(e) => setLimit(parseInt(e.target.value || "1"))}
          />
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Keyword
          </label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="kids, crib, quiet"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={cribsLikely}
            onChange={(e) => setCribsLikely(e.target.checked)}
          />
          Cribs likely
        </label>

        <button
          type="button"
          onClick={onSearch}
          disabled={busy}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2 font-semibold text-white shadow disabled:opacity-60"
        >
          {busy ? "Searching…" : "Search"}
        </button>
      </div>
    </div>
  );
}