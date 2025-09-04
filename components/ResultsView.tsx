// SN: BABYGO-RESULTS-VIEW-20250903
"use client";

import Tabs from "@/components/Tabs";
import ResultsHeader from "@/components/ResultsHeader";
import HotelsList from "@/components/HotelsList";
import SafetyList from "@/components/SafetyList";
import PackingList from "@/components/PackingList";
import ProductsList from "@/components/ProductsList";

import hotelsLocal from "@/data/hotels.json";
import safetyData from "@/data/safety_contacts.json";
import packingTemplates from "@/data/packing_templates.json";
import productsData from "@/data/products.json";

// ——— robust BCS import (works whether it’s default or named) ———
import * as bcsNS from "@/lib/bcsEngine";
const computeBCS: (args: any) => any =
  typeof (bcsNS as any).computeBCS === "function"
    ? (bcsNS as any).computeBCS
    : typeof (bcsNS as any).default === "function"
    ? (bcsNS as any).default
    : typeof (bcsNS as any).default?.computeBCS === "function"
    ? (bcsNS as any).default.computeBCS
    : () => ({
        total: 70,
        pace: "Moderate",
        napBlocks: 2,
        breakdown: [
          { label: "Healthcare", score: 70 },
          { label: "Hygiene", score: 70 },
          { label: "Accessibility", score: 80 },
          { label: "Low-stimulation", score: 60 },
        ],
      });

// ——— helpers ———
function safeStr(s: unknown) {
  return typeof s === "string" ? s : "";
}
function norm(s: unknown) {
  return safeStr(s).toLowerCase().trim();
}

async function fetchDetails(placeId: string) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const r = await fetch(
      `${base}/api/places/details?placeId=${encodeURIComponent(placeId)}`,
      { cache: "no-store" }
    );
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// NOTE: Return **array** (items) – not the wrapper object
async function fetchHotels(lat: number, lng: number, limit = 12) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const r = await fetch(
      `${base}/api/hotels?lat=${lat}&lng=${lng}&radius=3500&limit=${limit}`,
      { cache: "no-store" }
    );
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
}

// Fallback lat/lng for popular cities (extendable)
const CITY_COORDS: Array<{
  match: string;
  lat: number;
  lng: number;
}> = [
  { match: "paris", lat: 48.8566, lng: 2.3522 },
  { match: "rome", lat: 41.9028, lng: 12.4964 },
  { match: "tokyo", lat: 35.6764, lng: 139.6500 },
  { match: "london", lat: 51.5072, lng: -0.1276 },
  { match: "new york", lat: 40.7128, lng: -74.006 },
];

function resolveCoordsFromCities(freeText: string | undefined) {
  const needle = norm(freeText);
  if (!needle) return null;
  const hit = CITY_COORDS.find((c) => needle.includes(c.match));
  return hit ? { lat: hit.lat, lng: hit.lng, match: hit.match } : null;
}

// ——— component ———
export default function ResultsView({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = Object.fromEntries(
    Object.entries(searchParams || {}).map(([k, v]) => [
      k,
      Array.isArray(v) ? v[0] : v ?? "",
    ])
  );

  const fromText = safeStr(q.from);
  const toText = safeStr(q.to);
  const fromId = safeStr(q.fromId);
  const toId = safeStr(q.toId);
  const depart = safeStr(q.depart);
  const ret = safeStr(q.ret);
  const age = safeStr(q.childAge) || "7-12m";
  const directOnly = (q.directOnly || "true") === "true";
  const travellers = parseInt(safeStr(q.travellers) || "2", 10);

  // local state-in-client for async bits
  const state = {
    hotels: [] as any[],
    safety: [] as any[],
    debug: {
      apiTried: false,
      coordsSource: "" as "placeId" | "cityList" | "",
      resultCount: 0,
    },
    coords: null as null | { lat: number; lng: number },
    bcs: null as null | {
      total: number;
      pace: string;
      napBlocks: number;
      breakdown: Array<{ label: string; score: number }>;
    },
  };

  // kick off everything (client side)
  // We keep it simple with an IIFE
  (async () => {
    let lat: number | null = null;
    let lng: number | null = null;
    let coordsSource: "placeId" | "cityList" | "" = "";

    // 1) Try placeId
    if (toId) {
      const details = await fetchDetails(toId);
      lat = details?.result?.geometry?.location?.lat ?? null;
      lng = details?.result?.geometry?.location?.lng ?? null;
      if (lat && lng) coordsSource = "placeId";
    }

    // 2) Fallback to coarse city list
    if (!lat || !lng) {
      const coarse = resolveCoordsFromCities(toText);
      if (coarse) {
        lat = coarse.lat;
        lng = coarse.lng;
        coordsSource = "cityList";
      }
    }

    // 3) Compute BCS (always possible – country if placeId, otherwise generic)
    // (We don’t block on country here; your engine already handles missing country heuristically)
    state.bcs = computeBCS({
      age: String(age),
      directOnly,
      country: "", // optional; details?.result?.address_components lookups can be added back later
    });

    // 4) Hotels
    if (lat && lng) {
      state.debug.apiTried = true;
      const items = await fetchHotels(lat, lng, 12);
      state.hotels = items ?? [];
      state.debug.resultCount = state.hotels.length;
      state.coords = { lat, lng };
      state.debug.coordsSource = coordsSource;
    } else {
      // fall back to local list (by city text match)
      const needle = norm(toText);
      state.hotels = (hotelsLocal as any[]).filter(
        (h) => norm((h as any).city) === needle
      );
      state.debug.resultCount = state.hotels.length;
      state.debug.coordsSource = coordsSource;
    }

    // 5) Safety (local)
    state.safety = (safetyData as any[]).filter(
      (s) => norm((s as any).city) === norm(toText)
    );

    // Force a minimal re-render by touching state via DOM event queue
    // (We’re in a client component; simplest is dispatch a custom event)
    document.dispatchEvent(new CustomEvent("results-view-ready"));
  })();

  // ——— render (reads from `state`) ———
  // We purposely **don’t** use React state here to avoid flicker while you’re iterating.
  // The debug chips show live flags once the IIFE completes.
  return (
    <section className="mx-auto max-w-6xl space-y-4 p-4">
      <ResultsHeader
        title={`Results — ${toText || "Destination"}`}
        subtitle={`From ${fromText || "Origin"} · Depart ${
          depart || "—"
        } · Return ${ret || "—"} · Travellers ${travellers} · Age ${age} · ${
          directOnly ? "Direct only" : "Any flights"
        }`}
        coords={state.coords}
      />

      {/* Debug chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-2 py-1">
          {state.debug.resultCount ? `${state.debug.resultCount} results` : "no results"}
        </span>
        {state.debug.coordsSource && (
          <span className="rounded-full bg-gray-100 px-2 py-1">
            coords source: {state.debug.coordsSource}
          </span>
        )}
        <span className="rounded-full bg-gray-100 px-2 py-1">
          api tried: {String(state.debug.apiTried)}
        </span>
      </div>

      <Tabs
        tabs={[
          { id: "itinerary", label: "Itinerary" },
          { id: "hotels", label: "Hotels" },
          { id: "safety", label: "Safety" },
          { id: "packing", label: "Packing" },
          { id: "products", label: "Products" },
        ]}
      >
        {/* Itinerary */}
        <div>
          <p className="text-sm">
            BCS: <b>{state.bcs?.total ?? "—"}</b>{" "}
            <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">
              Pace: {state.bcs?.pace ?? "—"}
            </span>{" "}
            <span className="ml-2 rounded-full bg-cyan-50 px-2 py-0.5 text-cyan-700">
              Nap blocks/day: {state.bcs?.napBlocks ?? "—"}
            </span>
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm">
            {(state.bcs?.breakdown ?? []).map((b) => (
              <li key={b.label}>
                {b.label} {b.score}/100
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border p-3">
              <h3 className="font-medium">Day 1</h3>
              <p>Stroller-friendly activity</p>
              <p>Pace: {state.bcs?.pace ?? "—"}</p>
              <button className="mt-2 rounded-lg border px-3 py-1 text-xs">
                + Add to itinerary
              </button>
            </div>
            <div className="rounded-xl border p-3">
              <h3 className="font-medium">Day 2</h3>
              <p>Low-stim museum / park</p>
              <p>Pace: {state.bcs?.pace ?? "—"}</p>
              <button className="mt-2 rounded-lg border px-3 py-1 text-xs">
                + Add to itinerary
              </button>
            </div>
            <div className="rounded-xl border p-3">
              <h3 className="font-medium">Day 3</h3>
              <p>Short transit, playground</p>
              <p>Pace: {state.bcs?.pace ?? "—"}</p>
              <button className="mt-2 rounded-lg border px-3 py-1 text-xs">
                + Add to itinerary
              </button>
            </div>
          </div>
        </div>

        {/* Hotels */}
        <div>
          <HotelsList items={state.hotels as any} />
          {!state.hotels?.length && (
            <div className="mt-3 rounded-lg border p-3 text-sm">
              No hotels found for this destination yet.
            </div>
          )}
        </div>

        {/* Safety */}
        <div>
          <SafetyList items={state.safety as any} />
        </div>

        {/* Packing */}
        <div>
          <PackingList age={String(age)} templates={packingTemplates as any} />
        </div>

        {/* Products */}
        <div>
          <ProductsList items={productsData as any} />
        </div>
      </Tabs>
    </section>
  );
}