// components/ResultsView.tsx
import Tabs from "@/components/Tabs";
import ResultsHeader from "@/components/ResultsHeader";
import HotelsList from "@/components/HotelsList";
import SafetyList from "@/components/SafetyList";
import PackingList from "@/components/PackingList";
import ProductsList from "@/components/ProductsList";
import HotelsFilter from "@/components/HotelsFilter";
import hotelsLocal from "@/data/hotels.json";
import safetyData from "@/data/safety_contacts.json";
import packingTemplates from "@/data/packing_templates.json";
import productsData from "@/data/products.json";
import * as bcsNS from "@/lib/bcsEngine";

type SP = { [k: string]: string | string[] | undefined };

// robust computeBCS resolver (works for either default/named export)
function resolveComputeBCS() {
  const ns: any = bcsNS;
  if (typeof ns.computeBCS === "function") return ns.computeBCS as Function;
  if (typeof ns.default === "function") return ns.default as Function;
  if (ns.default && typeof ns.default.computeBCS === "function")
    return ns.default.computeBCS as Function;
  // fallback (never blocks render)
  return (_: any) => ({
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

// ---- helpers ---------------------------------------------------------------
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

async function fetchHotels(params: {
  lat: number;
  lng: number;
  radius?: number;
  limit?: number;
  keyword?: string;
}) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const qs = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng),
      ...(params.radius ? { radius: String(params.radius) } : {}),
      ...(params.limit ? { limit: String(params.limit) } : {}),
      ...(params.keyword ? { keyword: params.keyword } : {}),
    });
    const r = await fetch(`${base}/api/hotels?${qs.toString()}`, {
      cache: "no-store",
    });
    if (!r.ok) return { items: [] as any[] };
    return await r.json();
  } catch {
    return { items: [] as any[] };
  }
}

function one(v: string | string[] | undefined, def = ""): string {
  return Array.isArray(v) ? v[0] ?? def : v ?? def;
}
// ---------------------------------------------------------------------------

export default async function ResultsView({
  searchParams,
}: {
  searchParams: SP;
}) {
  // flatten without tripping Next’s warning: only read what you need
  const fromText = one(searchParams.from);
  const toText = one(searchParams.to);
  const toId = one(searchParams.toId);
  const depart = one(searchParams.depart);
  const ret = one(searchParams.ret);
  const age = one(searchParams.childAge, "7-12m");
  const travellers = parseInt(one(searchParams.travellers, "2"));
  const directOnly = one(searchParams.directOnly, "true") === "true";

  // filters (hotels)
  const radius = parseInt(one(searchParams.radius, "3500"));
  const limit = parseInt(one(searchParams.limit, "12"));
  const keyword = one(searchParams.keyword, "");
  const cribsLikely = one(searchParams.cribs, "false") === "true";

  // coords from query (if present)
  const latQ = parseFloat(one(searchParams.lat, ""));
  const lngQ = parseFloat(one(searchParams.lng, ""));
  const hasLatLng = Number.isFinite(latQ) && Number.isFinite(lngQ);

  // resolve country for BCS, if we have details
  let lat: number | null = null;
  let lng: number | null = null;
  let coordSource: "latlng" | "placeId" | "none" = "none";
  let country = "";

  if (hasLatLng) {
    lat = latQ;
    lng = lngQ;
    coordSource = "latlng";
  } else if (toId) {
    const d = await fetchDetails(toId);
    const loc = d?.result?.geometry?.location;
    if (typeof loc?.lat === "number" && typeof loc?.lng === "number") {
      lat = loc.lat;
      lng = loc.lng;
      coordSource = "placeId";
    }
    country =
      d?.result?.address_components?.find((c: any) =>
        c.types?.includes("country")
      )?.long_name || "";
  }

  const bcs = computeBCS({ age, directOnly, country });

  // fetch hotels (API) if we have coords
  let apiTried = false;
  let apiItems: any[] = [];
  if (typeof lat === "number" && typeof lng === "number") {
    apiTried = true;
    const api = await fetchHotels({
      lat,
      lng,
      radius,
      limit,
      keyword: [keyword, cribsLikely ? "crib+baby+family" : ""]
        .filter(Boolean)
        .join(" "),
    });
    apiItems = Array.isArray(api?.items) ? api.items : [];
  }

  // fallback to local list (city match) if API returned nothing
  let hotels = apiItems;
  if (!hotels?.length) {
    hotels = (hotelsLocal as any[]).filter((h) =>
      toText ? h.city?.toLowerCase() === toText.toLowerCase() : false
    );
  }

  // tabs
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
        subtitle={`From ${fromText || "Origin"} · Depart ${
          depart || "—"
        } · Return ${ret || "—"} · Travellers ${travellers} · Age ${age} · ${
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
        <div className="space-y-4">
          {/* debug chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-3 py-1">
              coords source: {coordSource}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1">
              api tried: {String(apiTried)}
            </span>
            {typeof lat === "number" && typeof lng === "number" ? (
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {lat.toFixed(4)},{lng.toFixed(4)}
              </span>
            ) : null}
          </div>

          {/* filter form (client) */}
          <HotelsFilter
            initial={{
              locationText: toText || "",
              lat: typeof lat === "number" ? lat : null,
              lng: typeof lng === "number" ? lng : null,
              radius,
              limit,
              keyword,
              cribsLikely,
            }}
          />

          <HotelsList items={hotels as any} />
        </div>

        {/* Safety */}
        <div>
          <SafetyList
            items={(safetyData as any[]).filter((s) =>
              toText ? s.city?.toLowerCase() === toText.toLowerCase() : false
            )}
          />
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