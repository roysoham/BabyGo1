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
import HotelsTab from "@/components/HotelsTab";


// ---- Robust import resolver for BCS (handles default/named) -----------------
import * as bcsEngineNS from "@/lib/bcsEngine";
function resolveComputeBCS(): (args: any) => any {
  const ns: any = bcsEngineNS;
  if (typeof ns.computeBCS === "function") return ns.computeBCS;
  if (typeof ns.default === "function") return ns.default;
  if (ns.default && typeof ns.default.computeBCS === "function") {
    return ns.default.computeBCS;
  }
  // last-resort fallback so UI still renders
  return () => ({
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
}
const computeBCS = resolveComputeBCS();

// --------------------------- helpers ----------------------------------------
type SP = { [k: string]: string | string[] | undefined };

function norm(s: string) {
  return s.toLowerCase().trim();
}

function resolveCoordsFromCities(freeText: string):
  | { lat: number; lng: number; match: string }
  | null {
  try {
    const cities: Array<{ city?: string; lat?: number; lng?: number }> =
      // @ts-ignore – you have a cities.json in data/
      require("@/data/cities.json");
    const q = norm(freeText || "");
    if (!q) return null;
    const hit = cities.find((c) => c.city && norm(String(c.city)).includes(q));
    if (hit && typeof hit.lat === "number" && typeof hit.lng === "number") {
      return { lat: hit.lat, lng: hit.lng, match: String(hit.city) };
    }
  } catch (_) {}
  return null;
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

async function fetchHotels(lat: number, lng: number, limit = 24) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const r = await fetch(
      `${base}/api/hotels?lat=${lat}&lng=${lng}&limit=${limit}`,
      { cache: "no-store" }
    );
    if (!r.ok) return { items: [] as any[] };
    return await r.json();
  } catch {
    return { items: [] as any[] };
  }
}

// ------------------------------ component -----------------------------------
export default async function ResultsView({
  searchParams,
}: {
  searchParams: Promise<SP> | SP;
}) {
  // ✅ FIX: await searchParams before touching it
  const raw = await searchParams;

  // flatten to Record<string,string>
  const q: Record<string, string> = Object.fromEntries(
    Object.entries(raw ?? {}).map(([k, v]) => [
      k,
      Array.isArray(v) ? v[0] ?? "" : v ?? "",
    ])
  );

  const fromText = q.from || "";
  const toText = q.to || "";
  const toId = q.toId || "";
  const depart = q.depart || "";
  const ret = q.ret || "";
  const age = q.childAge || "7-12m";
  const directOnly = (q.directOnly || "true") === "true";
  const travellers = parseInt(q.travellers || "2", 10);

  // Resolve destination coordinates
  let lat: number | null = null;
  let lng: number | null = null;
  let coordsSource: "placeId" | "cities" | "none" = "none";

  if (toId) {
    const d = await fetchDetails(toId);
    const loc = d?.result?.geometry?.location;
    if (typeof loc?.lat === "number" && typeof loc?.lng === "number") {
      lat = loc.lat;
      lng = loc.lng;
      coordsSource = "placeId";
    }
  }
  if (lat == null || lng == null) {
    const cityHit = resolveCoordsFromCities(toText);
    if (cityHit) {
      lat = cityHit.lat;
      lng = cityHit.lng;
      coordsSource = "cities";
    }
  }

  // BCS (use country if you have it in details)
  const country =
    (await (async () => {
      if (!toId) return "";
      const d = await fetchDetails(toId);
      return (
        d?.result?.address_components?.find((c: any) =>
          c.types?.includes("country")
        )?.long_name || ""
      );
    })()) || "";

  const bcs = computeBCS({ age: String(age), directOnly, country });

  // Hotels (API first, fallback to local)
  let apiTried = false;
  let hotels: any[] = [];
  if (typeof lat === "number" && typeof lng === "number") {
    apiTried = true;
    const res = await fetchHotels(lat, lng, 24);
    hotels = Array.isArray(res?.items) ? res.items : [];
  }
  if (!hotels?.length) {
    // soft fallback to local curated hotels by exact city name
    try {
      const cityLc = (toText || "").toLowerCase();
      hotels = (hotelsLocal as any[]).filter(
        (h) => h.city && String(h.city).toLowerCase() === cityLc
      );
    } catch {
      hotels = [];
    }
  }

  const safety = (safetyData as any[]).filter((s) => {
    const cityLc = (toText || "").toLowerCase();
    return s.city && String(s.city).toLowerCase() === cityLc;
  });

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
        title={`Results — ${toText || "Destination"}`}
        subtitle={`From ${fromText || "Origin"} · Depart ${depart || "—"} · Return ${
          ret || "—"
        } · Travellers ${travellers} · Age ${age} · ${
          directOnly ? "Direct only" : "Any flights"
        }`}
        coords={
          typeof lat === "number" && typeof lng === "number"
            ? { lat, lng }
            : null
        }
      />

      <Tabs tabs={tabs}>
        {/* Itinerary */}
        <div>
          <p className="text-sm">
            BCS: <b>{bcs.total}</b> · Pace: <b>{bcs.pace}</b> · Nap blocks/day:{" "}
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
        <div>
          {/* tiny debug chips to help us see state fast */}
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border px-2 py-1">
              {hotels.length ? `${hotels.length} results` : "no results"}
            </span>
            <span className="rounded-full border px-2 py-1">
              coords source: {coordsSource}
            </span>
            <span className="rounded-full border px-2 py-1">
              api tried: {String(apiTried)}
            </span>
          </div>

          
          <HotelsTab />
        </div>

        {/* Safety */}
        <div>
          <SafetyList items={safety as any} />
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
