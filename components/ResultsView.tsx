// components/ResultsView.tsx
import Tabs from "@/components/Tabs";
import ResultsHeader from "@/components/ResultsHeader";
import HotelsList from "@/components/HotelsList";
import HotelsFilter from "@/components/HotelsFilter";
import KBInsights from "@/components/KBInsights";

import packingTemplates from "@/data/packing_templates.json";
import safetyData from "@/data/safety_contacts.json";
import productsData from "@/data/products.json";
import hotelsLocal from "@/data/hotels.json";

import { computeBCS } from "@/lib/bcsEngine";
import { findCityByName } from "@/lib/fallbackCities";

/* --------------------------- helpers --------------------------- */

function one(
  v: string | string[] | undefined,
  dflt = ""
): string {
  if (Array.isArray(v)) return v[0] ?? dflt;
  return v ?? dflt;
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

type HotelSearchOpts = {
  lat: number;
  lng: number;
  radius?: number;
  minRating?: number;
  price?: number;
  limit?: number;
  keyword?: string;
  cribs?: boolean;
};

async function fetchHotels(opts: HotelSearchOpts) {
  const params = new URLSearchParams();
  params.set("lat", String(opts.lat));
  params.set("lng", String(opts.lng));
  if (opts.radius) params.set("radius", String(opts.radius));
  if (opts.minRating !== undefined) params.set("minRating", String(opts.minRating));
  if (opts.price !== undefined) params.set("price", String(opts.price));
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.keyword) params.set("keyword", opts.keyword);
  if (opts.cribs !== undefined) params.set("cribs", String(opts.cribs));

  const url = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/hotels?${params.toString()}`;
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return { items: [], debug: { tried: true, ok: false, url } };
    const data = await r.json();
    return { items: Array.isArray(data?.items) ? data.items : [], debug: { tried: true, ok: true, url } };
  } catch {
    return { items: [], debug: { tried: true, ok: false, url } };
  }
}

/* --------------------------- page component --------------------------- */

export default async function ResultsView({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  // Flatten query
  const q: Record<string, string> = Object.fromEntries(
    Object.entries(searchParams ?? {}).map(([k, v]) => [
      k,
      Array.isArray(v) ? v[0] ?? "" : v ?? "",
    ])
  );

  // Header fields
  const fromText = q.from || "Origin";
  const toText = q.to || "Destination";
  const fromId = q.fromId || "";
  const toId = q.toId || "";
  const depart = q.depart || "—";
  const ret = q.ret || "—";
  const age = q.childAge || "7-12m";
  const travellers = parseInt(q.travellers || "2", 10) || 2;
  const directOnly = (q.directOnly || "true") === "true";

  /* -------- resolve coords: query -> placeId -> fallback city -------- */

  let lat: number | null = null;
  let lng: number | null = null;
  let coordsSource: "query" | "placeId" | "cities" | "none" = "none";

  // 1) direct lat/lng in URL
  const latQ = parseFloat(q.lat || "");
  const lngQ = parseFloat(q.lng || "");
  if (Number.isFinite(latQ) && Number.isFinite(lngQ)) {
    lat = latQ;
    lng = lngQ;
    coordsSource = "query";
  }

  // 2) fallback to Places Details if we have toId
  if ((lat == null || lng == null) && toId) {
    const d = await fetchDetails(toId);
    const loc = d?.result?.geometry?.location;
    if (Number.isFinite(loc?.lat) && Number.isFinite(loc?.lng)) {
      lat = Number(loc.lat);
      lng = Number(loc.lng);
      coordsSource = "placeId";
    }
  }

  // 3) last resort: our local fallback list
  if (lat == null || lng == null) {
    const hit = findCityByName(toText);
    if (hit) {
      lat = hit.lat;
      lng = hit.lng;
      coordsSource = "cities";
    }
  }

  const hasLatLng = Number.isFinite(lat as number) && Number.isFinite(lng as number);

  /* --------------------------- BCS --------------------------- */
  // try to get country name when we used placeId; otherwise blank (BCS still renders)
  let country = "";
  if (coordsSource === "placeId" && toId) {
    const d = await fetchDetails(toId);
    country =
      d?.result?.address_components?.find((c: any) =>
        c?.types?.includes("country")
      )?.long_name || "";
  }
  const bcs = computeBCS({ age, directOnly, country });

  /* --------------------------- hotels --------------------------- */

  // Read filters
  const radius = parseInt(q.radius || "3500", 10) || 3500;
  const minRating = parseFloat(q.minRating || "0") || 0;
  const price = parseInt(q.price || "0", 10) || 0; // 0..5
  const limit = parseInt(q.limit || "12", 10) || 12;
  const keyword = q.keyword || "";
  const cribs = (q.cribs || "false") === "true";

  let items: any[] = [];
  let apiTried = false;

  if (hasLatLng) {
    const resp = await fetchHotels({
      lat: lat as number,
      lng: lng as number,
      radius,
      minRating,
      price,
      limit,
      keyword,
      cribs,
    });
    apiTried = resp.debug?.tried ?? true;
    items = resp.items;

    // fallback to bundled JSON if API returned nothing
    if (items.length === 0 && hotelsLocal && Array.isArray(hotelsLocal)) {
      const norm = (s: string) => s.toLowerCase().trim();
      items = (hotelsLocal as any[]).filter(
        (h) => norm(h.city || "") === norm(toText)
      );
    }
  }

  /* --------------------------- render --------------------------- */

  const gmapsUrl =
    hasLatLng && lat && lng
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : null;

  const tabs = [
    { id: "itinerary", label: "Itinerary" },
    { id: "hotels", label: "Hotels" },
    { id: "safety", label: "Safety" },
    { id: "packing", label: "Packing" },
    { id: "products", label: "Products" },
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-4 p-4">
      <ResultsHeader
        title={`Results — ${toText}`}
        subtitle={`From ${fromText} · Depart ${depart} · Return ${ret} · Travellers ${travellers} · Age ${age} · ${
          directOnly ? "Direct only" : "Any flights"
        }`}
        coords={hasLatLng ? { lat: lat as number, lng: lng as number } : null}
        gmapsUrl={gmapsUrl}
      />

      <Tabs tabs={tabs}>
        {/* Itinerary */}
        <div>
          <p className="text-sm">
            BCS <b>{bcs.total}</b> · Pace <b>{bcs.pace}</b> · Nap blocks/day{" "}
            <b>{bcs.napBlocks}</b>
          </p>
          <ul className="mt-2 list-disc pl-6 text-sm">
            {bcs.breakdown.map((b: any) => (
              <li key={b.label}>
                {b.label} {b.score}/100
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border p-3">
              <h3 className="font-medium">Day 1</h3>
              <p>Stroller-friendly activity</p>
              <p>Pace: {bcs.pace}</p>
            </div>
            <div className="rounded-xl border p-3">
              <h3 className="font-medium">Day 2</h3>
              <p>Low-stim museum / park</p>
              <p>Pace: {bcs.pace}</p>
            </div>
            <div className="rounded-xl border p-3">
              <h3 className="font-medium">Day 3</h3>
              <p>Short transit, playground</p>
              <p>Pace: {bcs.pace}</p>
            </div>
          </div>
        </div>

        {/* Hotels */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-gray-100 px-2 py-1">
              coords source: {coordsSource}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-1">
              api tried: {String(apiTried)}
            </span>
            {items.length === 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-1">
                no results
              </span>
            )}
          </div>

          <HotelsFilter
            defaultCity={toText}
            hasLatLng={hasLatLng}
          />

          <KBInsights city={toText} />

          <div className="rounded-2xl border bg-white p-4">
            <div className="mb-3 text-sm text-gray-700">
              BCS <b>{bcs.total}</b> • Pace <b>{bcs.pace}</b> • Nap blocks/day{" "}
              <b>{bcs.napBlocks}</b>
            </div>
            <HotelsList items={items} />
          </div>
        </div>

        {/* Safety */}
        <div>
          {/* your SafetyList unchanged */}
        </div>

        {/* Packing */}
        <div>
          {/* your PackingList unchanged */}
        </div>

        {/* Products */}
        <div>
          {/* your ProductsList unchanged */}
        </div>
      </Tabs>
    </section>
  );
}