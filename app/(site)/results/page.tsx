import Tabs from "@/components/Tabs";
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
  const lat = toDetails?.result?.geometry?.location?.lat ?? null;
  const lng = toDetails?.result?.geometry?.location?.lng ?? null;

  const bcs = computeBCS({
    age: age as string,
    directOnly,
    country
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
      <div className="rounded-2xl border bg-white p-4">
        <h1 className="text-xl font-semibold">Results — {toText || "Destination"}</h1>
        <p className="text-sm text-gray-600">
          From <b>{fromText || "Origin"}</b> · Depart {depart || "—"} · Return {ret || "—"} · Travellers {travellers} · Age {age} · {directOnly ? "Direct only" : "Any flights"}
        </p>
        {lat && lng ? <p className="mt-1 text-xs text-gray-500">Coords: {lat}, {lng}{country?` · ${country}`:""}</p> : null}
      </div>

      <Tabs tabs={tabs}>
        <div>
          <p className="text-sm">BCS: <b>{bcs.total}</b> · Pace: <b>{bcs.pace}</b> · Nap blocks/day: <b>{bcs.napBlocks}</b></p>
          <ul className="mt-2 list-disc pl-6 text-sm">
            {bcs.breakdown.map(b=>(<li key={b.label}>{b.label} {b.score}/100</li>))}
          </ul>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border p-3"><h3 className="font-medium">Day 1</h3><p>Stroller‑friendly activity</p><p>Pace: {bcs.pace}</p></div>
            <div className="rounded-xl border p-3"><h3 className="font-medium">Day 2</h3><p>Low‑stim museum / park</p><p>Pace: {bcs.pace}</p></div>
            <div className="rounded-xl border p-3"><h3 className="font-medium">Day 3</h3><p>Short transit, playground</p><p>Pace: {bcs.pace}</p></div>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600">Sample hotels data to be wired to Google Hotels API.</p>
          <ul className="mt-2 list-disc pl-6 text-sm">
            <li>Cribs/cots guaranteed · Blackout curtains</li>
            <li>Connecting rooms available</li>
          </ul>
        </div>
        <div>
          <p className="text-sm">Local emergency numbers vary. EU: 112 · US: 911</p>
          <p className="text-xs text-gray-600">Add pediatric clinics & pharmacies dataset here.</p>
        </div>
        <div>
          <p className="text-sm">Packing list adapts to age: {age} and pace: {bcs.pace}. Example:</p>
          <ul className="mt-2 list-disc pl-6 text-sm">
            <li>Sterilizing bags · Bottle brush</li>
            <li>White noise · Swaddles</li>
          </ul>
        </div>
        <div>
          <ul className="list-disc pl-6 text-sm">
            <li>Travel bottle brush — Amazon</li>
            <li>Sterilizer bags — FirstCry</li>
          </ul>
        </div>
      </Tabs>
    </section>
  );
}
