// components/HotelsFilter.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

const MIN_RATINGS = ["Any", "3.5+", "4.0+", "4.5+" ] as const;
const PRICES = ["Any", "$", "$$", "$$$", "$$$$", "$$$$$"] as const;

export default function HotelsFilter({
  defaultCity,
  hasLatLng,
}: {
  defaultCity?: string;
  hasLatLng?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [city, setCity] = React.useState(defaultCity || sp.get("to") || "");
  const [radius, setRadius] = React.useState(sp.get("radius") || "3500");
  const [minRating, setMinRating] = React.useState(sp.get("minRating") || "0");
  const [price, setPrice] = React.useState(sp.get("price") || "5");
  const [limit, setLimit] = React.useState(sp.get("limit") || "12");
  const [keyword, setKeyword] = React.useState(sp.get("keyword") || "");
  const [cribs, setCribs] = React.useState(sp.get("cribs") === "true");

  function reset() {
    setCity(defaultCity || sp.get("to") || "");
    setRadius("3500");
    setMinRating("0");
    setPrice("5");
    setLimit("12");
    setKeyword("");
    setCribs(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();

    // Build new query from current URL, then mutate filter params only
    const q = new URLSearchParams(sp.toString());

    // Keep top-level trip params as-is (from/to/depart/ret/etc.)
    if (city) q.set("to", city);

    q.set("radius", radius || "3500");
    q.set("minRating", minRating || "0");
    q.set("price", price || "5");
    q.set("limit", limit || "12");
    q.set("keyword", keyword || "");
    q.set("cribs", String(Boolean(cribs)));

    // Important: we do NOT require lat/lng here.
    // ResultsView will derive coords from toId or fallbackCities.
    router.push(`/results?${q.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border bg-white p-4 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <label className="md:col-span-5 text-sm">
          <span className="mb-1 block text-gray-600">Location</span>
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Paris, France"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>

        <label className="md:col-span-2 text-sm">
          <span className="mb-1 block text-gray-600">Radius (m)</span>
          <input
            className="w-full rounded-lg border px-3 py-2"
            inputMode="numeric"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
        </label>

        <label className="md:col-span-2 text-sm">
          <span className="mb-1 block text-gray-600">Min rating</span>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          >
            <option value="0">Any</option>
            <option value="3.5">3.5+</option>
            <option value="4.0">4.0+</option>
            <option value="4.5">4.5+</option>
          </select>
        </label>

        <label className="md:col-span-2 text-sm">
          <span className="mb-1 block text-gray-600">Max price level</span>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          >
            <option value="5">Any</option>
            <option value="1">$</option>
            <option value="2">$$</option>
            <option value="3">$$$</option>
            <option value="4">$$$$</option>
          </select>
        </label>

        <label className="md:col-span-1 text-sm">
          <span className="mb-1 block text-gray-600">Limit</span>
          <input
            className="w-full rounded-lg border px-3 py-2"
            inputMode="numeric"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
        <label className="md:col-span-10 text-sm">
          <span className="mb-1 block text-gray-600">Keyword</span>
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="kids, crib, quiet"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </label>

        <label className="md:col-span-2 flex items-end gap-3 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={cribs}
            onChange={(e) => setCribs(e.target.checked)}
          />
          <span>Cribs likely</span>
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2 font-semibold text-white shadow"
        >
          Search
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border px-4 py-2 text-sm"
        >
          Reset
        </button>
        {!hasLatLng && (
          <span className="text-xs text-gray-500">
            Tip: you can also paste <code>lat</code>, <code>lng</code> in the
            URL; we’ll use those first.
          </span>
        )}
      </div>
    </form>
  );
}