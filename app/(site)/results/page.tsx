import Tabs from "@/components/Tabs";
import ResultsHeader from "@/components/ResultsHeader";
import SafetyList from "@/components/SafetyList";
import PackingList from "@/components/PackingList";
import ProductsList from "@/components/ProductsList";
import HotelsFilters from "@/components/HotelsFilters";
import HotelsTab from "@/components/HotelsTab";
import safetyData from "@/data/safety_contacts.json";
import packingTemplates from "@/data/packing_templates.json";
import productsData from "@/data/products.json";
import { computeBCS } from "@/lib/bcsEngine";

async function fetchDetails(placeId: string){
  try{
    const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/places/details?placeId=${encodeURIComponent(placeId)}`, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  }catch{
    return null;
  }
}

export default async function ResultsPage({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }){
  const q = Object.fromEntries(Object.entries(searchParams).map(([k,v])=>[k, Array.isArray(v)? v[0] : (v ?? "")]));
  const fromText = q.from || "";
  const toText = q.to || "";
  const fromId = q.fromId || "";
  const toId = q.toId || "";
  const depart = q.depart || "";
  const ret = q.ret || "";
  const age = q.childAge || "7-12m";
  const directOnly = (q.directOnly || "true") === "true";
  const travellers = parseInt(q.travellers || "2");

  let toDetails: any = null;
  if (toId) toDetails = await fetchDetails(toId as string);
  const country = toDetails?.result?.address_components?.find((c:any)=>c.types?.includes("country"))?.long_name || "";
  const lat = toDetails?.result?.geometry?.location?.lat ?? (q.lat ? Number(q.lat) : null);
  const lng = toDetails?.result?.geometry?.location?.lng ?? (q.lng ? Number(q.lng) : null);

  const bcs = computeBCS({ age: age as string, directOnly, country });

  const safety = (safetyData as any[]).filter(s => !toText || s.city.toLowerCase() === String(toText).toLowerCase());

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
        subtitle={`From ${fromText || "Origin"} · Depart ${depart || "—"} · Return ${ret || "—"} · Travellers ${travellers} · Age ${age} · ${directOnly ? "Direct only" : "Any flights"}`}
        coords={lat && lng ? {lat, lng} : null}
      />
      <Tabs tabs={tabs}>
        {/* Itinerary */}
        <div>
          <p className="text-sm">BCS: <b>{bcs.total}</b> · Pace: <b>{bcs.pace}</b> · Nap blocks/day: <b>{bcs.napBlocks}</b></p>
          <ul className="mt-2 list-disc pl-6 text-sm">
            {bcs.breakdown.map(b=>(<li key={b.label}>{b.label} {b.score}/100</li>))}
          </ul>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border p-3"><h3 className="font-medium">Day 1</h3><p>Stroller-friendly activity</p><p>Pace: {bcs.pace}</p></div>
            <div className="rounded-xl border p-3"><h3 className="font-medium">Day 2</h3><p>Low-stim museum / park</p><p>Pace: {bcs.pace}</p></div>
            <div className="rounded-xl border p-3"><h3 className="font-medium">Day 3</h3><p>Short transit, playground</p><p>Pace: {bcs.pace}</p></div>
          </div>
        </div>
        {/* Hotels */}
        <div>
          <HotelsFilters />
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