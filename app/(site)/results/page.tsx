import Tabs from "@/components/Tabs";
import { computeBCS, defaultPace, recommendedNapBlocks } from "@/lib/bcsEngine";
import cities from "@/data/cities.json";
import bcsData from "@/data/bcs_pillars.json";
import hotels from "@/data/hotels.json";
import safety from "@/data/safety_contacts.json";
import packing from "@/data/packing_templates.json";
import products from "@/data/products.json";

type SP = Record<string, string>;
function getDestId(city: string) {
  const slug = city.trim().toLowerCase().replace(/\s+/g, "_");
  const found = (cities as any[]).find(c => c.city.toLowerCase() === city.toLowerCase());
  return found?.destination_id || slug;
}
export default function ResultsPage({ searchParams }: { searchParams: SP }) {
  const { from = "", to = "", depart = "", ret = "", travellers = "2", childAge = "7-12m", directOnly = "true" } = searchParams;
  const destId = getDestId(to || "");
  const pillarsEntry = (bcsData as any[]).find(e => e.destination_id === destId);
  const pillars = pillarsEntry?.pillars || { healthcare: 75, hygiene: 75, accessibility: 70, stimulation: 40, transit: 40, climate: 70 };
  const bcs = computeBCS(pillars, childAge as any);
  const cityInfo = (cities as any[]).find(c => c.destination_id === destId);
  const cityCountry = cityInfo ? `${cityInfo.city}, ${cityInfo.country}` : to;
  const tabs = [
    { key: "itinerary", label: "Itinerary", content: (
      <div className="space-y-3">
        <p className="text-sm">BCS: <strong>{bcs.score}</strong> <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{bcs.tag}</span></p>
        <ul className="list-disc pl-6 text-sm text-gray-700">{bcs.rationale.map((r, i) => <li key={i}>{r}</li>)}</ul>
        <div className="grid gap-3 md:grid-cols-3">
          {["Day 1","Day 2","Day 3"].map((d, i) => (
            <div key={i} className="rounded-lg border bg-white p-3">
              <h3 className="font-semibold">{d}</h3>
              <ul className="mt-2 text-sm">
                <li>Stroller-friendly activity</li>
                <li>{recommendedNapBlocks(childAge as any)}× nap blocks</li>
                <li>Pace: {defaultPace(childAge as any)}</li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    )},
    { key: "hotels", label: "Hotels", content: (
      <div className="grid gap-3 md:grid-cols-2">
        {(hotels as any[]).filter(h => h.destination_id === destId).map(h => (
          <div key={h.hotel_id} className="rounded-lg border bg-white p-3">
            <h3 className="font-semibold">{h.name}</h3>
            <p className="text-sm text-gray-600">Tier: {h.price_tier} · Clinic proximity: {h.distance_to_pediatric_clinic_km}km</p>
            <ul className="mt-2 text-sm">{Object.entries(h.amenities).map(([k, v]) => v ? <li key={k}>✓ {k.replaceAll("_"," ")}</li> : null)}</ul>
          </div>
        ))}
      </div>
    )},
    { key: "safety", label: "Safety", content: (
      <div className="space-y-2">
        <p className="text-sm">Emergency: <strong>{cityInfo?.local_emergency_number || "112/911"}</strong></p>
        <div className="grid gap-3 md:grid-cols-2">
          {(safety as any[]).find(s => s.destination_id === destId)?.clinics?.map((c: any, idx: number) => (
            <div key={idx} className="rounded-lg border bg-white p-3 text-sm">
              <h4 className="font-semibold">{c.name}</h4>
              <p>{c.address}</p>
              <p>{c.phone} {c.speaks_english ? "· English OK" : ""}</p>
              <a className="text-indigo-600 underline" href={c.map_link}>Map</a>
            </div>
          )) || <p className="text-sm text-gray-600">No clinics data yet.</p>}
        </div>
      </div>
    )},
    { key: "packing", label: "Packing", content: (
      <div className="space-y-2">
        {(packing as any[]).filter(p => p.season === "Mild").map((t) => (
          <div key={t.template_id} className="rounded-lg border bg-white p-3">
            <h4 className="font-semibold">{t.season} • {t.age_band}</h4>
            <ul className="mt-2 text-sm list-disc pl-6">{t.items.map((it: any, idx: number) => <li key={idx}>{it.name}{it.mandatory ? " • must-have" : ""}</li>)}</ul>
          </div>
        ))}
      </div>
    )},
    { key: "products", label: "Products", content: (
      <div className="grid gap-3 md:grid-cols-2">
        {(products as any[]).filter(p => (cityInfo?.country === "India" ? p.region_codes.includes("IN") : true)).map(prod => (
          <a key={prod.product_id} className="rounded-lg border bg-white p-3 block hover:shadow" href={prod.url}>
            <h4 className="font-semibold">{prod.name}</h4>
            <p className="text-sm">{prod.retailer} · {prod.price_currency} {prod.price_value}</p>
          </a>
        ))}
      </div>
    )}
  ];
  return (
    <section className="space-y-3">
      <div className="rounded-xl border bg-white p-4 shadow">
        <h2 className="text-xl font-bold">Results — {cityCountry}</h2>
        <p className="text-sm text-gray-600">
          From <strong>{from}</strong> to <strong>{to}</strong>
          {depart && <> · Depart {depart}</>}
          {ret && <> · Return {ret}</>}
          {travellers && <> · Travellers {travellers}</>}
          {childAge && <> · Age {childAge}</>}
          {directOnly && directOnly !== "false" && <> · Direct only</>}
        </p>
      </div>
      <Tabs tabs={tabs} />
    </section>
  );
}
