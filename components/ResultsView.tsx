import Tabs from "@/components/Tabs";
import ResultsHeader from "@/components/ResultsHeader";
import HotelsFilter from "@/components/HotelsFilter";
import HotelsList from "@/components/HotelsList";
import SafetyList from "@/components/SafetyList";
import PackingList from "@/components/PackingList";
import ProductsList from "@/components/ProductsList";

import safetyData from "@/data/safety_contacts.json";
import packingTemplates from "@/data/packing_templates.json";
import productsData from "@/data/products.json";
import hotelsLocal from "@/data/hotels.json";
import { computeBCS } from "@/lib/bcsEngine";

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined, d = "") =>
  Array.isArray(v) ? (v[0] ?? d) : (v ?? d);

// --- coord resolver (server side): query -> fallbackCities -> null
async function resolveCoords(toText: string, latQ: string, lngQ: string) {
  const latP = parseFloat(latQ || "");
  const lngP = parseFloat(lngQ || "");
  if (Number.isFinite(latP) && Number.isFinite(lngP)) {
    return { lat: latP, lng: lngP, source: "query" as const };
  }
  try {
    const { default: cities } = await import("@/lib/fallbackCities");
    const t = (toText || "").toLowerCase();
    const hit =
      cities.find(c => c.names.some(n => t.includes(n.toLowerCase()))) || null;
    if (hit) return { lat: hit.lat, lng: hit.lng, source: "cities" as const };
  } catch { /* ignore */ }
  return { lat: null as any, lng: null as any, source: "none" as const };
}

async function fetchHotels(lat: number, lng: number, params: {
  radius: number; minRating: number; price: number; limit: number; keyword: string; cribs: boolean;
}) {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/hotels`, "http://localhost");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lng", String(lng));
    url.searchParams.set("radius", String(params.radius));
    url.searchParams.set("minRating", String(params.minRating));
    url.searchParams.set("price", String(params.price));
    url.searchParams.set("limit", String(params.limit));
    if (params.keyword) url.searchParams.set("keyword", params.keyword);
    if (params.cribs) url.searchParams.set("cribs", "true");

    const r = await fetch(url.toString().replace("http://localhost", ""), { cache: "no-store" });
    if (!r.ok) return { items: [], tried: true };
    const j = await r.json();
    return { items: j?.items ?? [], tried: true };
  } catch {
    return { items: [], tried: true };
  }
}

export default async function ResultsView({ searchParams }: { searchParams: SP }) {
  // read flat
  const q: Record<string, string> = Object.fromEntries(
    Object.entries(searchParams ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] ?? "" : v ?? ""])
  );

  const fromText = q.from || "Origin";
  const toText = q.to || "Destination";
  const depart = q.depart || "—";
  const ret = q.ret || "—";
  const travellers = parseInt(q.travellers || "2");
  const age = q.childAge || "7-12m";
  const directOnly = (q.directOnly || "true") === "true";

  const limit = parseInt(q.limit || "12");
  const radius = parseInt(q.radius || "3500");
  const minRating = parseFloat(q.minRating || "0");
  const price = parseInt(q.price || "0");
  const keyword = q.keyword || "";
  const cribs = (q.cribs || "false") === "true";

  // coords
  const coords = await resolveCoords(toText, q.lat || "", q.lng || "");
  const hasCoords = Number.isFinite(coords.lat as unknown as number) && Number.isFinite(coords.lng as unknown as number);

  // BCS (country unknown here; keep basic scoring)
  const bcs = computeBCS({ age, directOnly, country: "" });

  // hotels
  let hotels: any[] = [];
  let apiTried = false;
  if (hasCoords) {
    const res = await fetchHotels(coords.lat as unknown as number, coords.lng as unknown as number,
      { radius, minRating, price, limit, keyword, cribs });
    hotels = res.items;
    apiTried = res.tried;
  }
  // fallback local
  if (hotels.length === 0) {
    const t = toText.toLowerCase();
    hotels = (hotelsLocal as any[]).filter(h => h.city?.toLowerCase?.() === t);
  }

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
        subtitle={`From ${fromText} · Depart ${depart} · Return ${ret} · Travellers ${travellers} · Age ${age} · ${directOnly ? "Direct only" : "Any flights"}`}
        coords={hasCoords ? { lat: coords.lat, lng: coords.lng } : null}
      />
      <Tabs tabs={tabs}>
        {/* Itinerary */}
        <div>
          <p className="text-sm">BCS: <b>{bcs.total}</b> · Pace: <b>{bcs.pace}</b> · Nap blocks/day: <b>{bcs.napBlocks}</b></p>
          <ul className="mt-2 list-disc pl-6 text-sm">
            {bcs.breakdown.map(b => (<li key={b.label}>{b.label} {b.score}/100</li>))}
          </ul>
        </div>

        {/* Hotels */}
        <div className="space-y-3">
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-1">coords source: {coords.source}</span>
            <span className="rounded-full bg-gray-100 px-2 py-1">api tried: {apiTried ? "true" : "false"}</span>
          </div>
          <HotelsFilter
            initial={{
              location: toText,
              lat: hasCoords ? (coords.lat as unknown as number) : undefined,
              lng: hasCoords ? (coords.lng as unknown as number) : undefined,
              radius, minRating, price, limit, keyword, cribs
            }}
          />
          <HotelsList items={hotels as any} />
        </div>

        {/* Safety */}
        <div>
          <SafetyList items={safetyData as any} />
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