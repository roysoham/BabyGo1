set -euo pipefail

echo "→ Normalizing BabyGo tree & installing live-hotels + BCS"

# 0) Folders
mkdir -p app/(site)/results app/api/hotels components lib data scripts

# 1) Remove dup api folders if present
[ -d api/api ] && rm -rf api/api
[ -d pages/api ] && rm -rf pages/api

# 2) tsconfig alias
if [ -f tsconfig.json ]; then
  node - <<'NODE'
const fs=require('fs');
const j=JSON.parse(fs.readFileSync('tsconfig.json','utf8'));
j.compilerOptions=j.compilerOptions||{};
j.compilerOptions.baseUrl=".";
j.compilerOptions.paths=j.compilerOptions.paths||{};
j.compilerOptions.paths["@/*"]=["*"];
fs.writeFileSync('tsconfig.json', JSON.stringify(j,null,2));
console.log("✔ tsconfig.json alias ensured");
NODE
else
  cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom","es2020"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["*"] }
  }
}
JSON
fi

write(){ mkdir -p "$(dirname "$1")"; cat > "$1"; echo "✔ wrote $1"; }

# 3) Components
write components/ResultsHeader.tsx <<'TS'
"use client";
export default function ResultsHeader({
  title, subtitle, gmapsUrl, coords
}: { title: string; subtitle: string; gmapsUrl?: string | null; coords?: {lat:number;lng:number} | null; }) {
  return (
    <header className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {coords ? (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
              {coords.lat.toFixed(3)},{coords.lng.toFixed(3)}
            </span>
          ) : null}
          {gmapsUrl ? (
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
               className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow">
              Open in Google Maps
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
TS

write components/HotelsFilter.tsx <<'TS'
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
export default function HotelsFilter({ defaultCity, hasLatLng }: { defaultCity?: string; hasLatLng?: boolean; }) {
  const sp = useSearchParams(); const router=useRouter();
  const [city,setCity]=React.useState(defaultCity||sp.get("to")||"");
  const [radius,setRadius]=React.useState(sp.get("radius")||"3500");
  const [minRating,setMin]=React.useState(sp.get("minRating")||"0");
  const [price,setPrice]=React.useState(sp.get("price")||"5");
  const [limit,setLimit]=React.useState(sp.get("limit")||"12");
  const [keyword,setKeyword]=React.useState(sp.get("keyword")||"");
  const [cribs,setCribs]=React.useState(sp.get("cribs")==="true");
  function onSubmit(e:React.FormEvent){ e.preventDefault();
    const q=new URLSearchParams(sp.toString());
    if (city) q.set("to",city);
    q.set("radius",radius||"3500"); q.set("minRating",minRating||"0");
    q.set("price",price||"5"); q.set("limit",limit||"12");
    q.set("keyword",keyword||""); q.set("cribs",String(cribs));
    router.push(`/results?${q.toString()}`);
  }
  function onReset(){ setCity(defaultCity||""); setRadius("3500"); setMin("0"); setPrice("5"); setLimit("12"); setKeyword(""); setCribs(false); }
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <label className="md:col-span-5 text-sm">
          <span className="mb-1 block text-gray-600">Location</span>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Paris, France"
                 value={city} onChange={e=>setCity(e.target.value)} />
        </label>
        <label className="md:col-span-2 text-sm"><span className="mb-1 block text-gray-600">Radius (m)</span>
          <input className="w-full rounded-lg border px-3 py-2" value={radius} onChange={e=>setRadius(e.target.value)} />
        </label>
        <label className="md:col-span-2 text-sm"><span className="mb-1 block text-gray-600">Min rating</span>
          <select className="w-full rounded-lg border px-3 py-2" value={minRating} onChange={e=>setMin(e.target.value)}>
            <option value="0">Any</option><option value="3.5">3.5+</option><option value="4.0">4.0+</option><option value="4.5">4.5+</option>
          </select>
        </label>
        <label className="md:col-span-2 text-sm"><span className="mb-1 block text-gray-600">Max price</span>
          <select className="w-full rounded-lg border px-3 py-2" value={price} onChange={e=>setPrice(e.target.value)}>
            <option value="5">Any</option><option value="1">$</option><option value="2">$$</option><option value="3">$$$</option><option value="4">$$$$</option>
          </select>
        </label>
        <label className="md:col-span-1 text-sm"><span className="mb-1 block text-gray-600">Limit</span>
          <input className="w-full rounded-lg border px-3 py-2" value={limit} onChange={e=>setLimit(e.target.value)} />
        </label>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
        <label className="md:col-span-10 text-sm"><span className="mb-1 block text-gray-600">Keyword</span>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="kids, crib, quiet"
                 value={keyword} onChange={e=>setKeyword(e.target.value)} />
        </label>
        <label className="md:col-span-2 flex items-end gap-3 text-sm">
          <input type="checkbox" className="h-5 w-5" checked={cribs} onChange={e=>setCribs(e.target.checked)} />
          <span>Cribs likely</span>
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2 font-semibold text-white shadow">Search</button>
        <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2 text-sm">Reset</button>
        {!hasLatLng && <span className="text-xs text-gray-500">Tip: add <code>lat,lng</code> in URL to force coords.</span>}
      </div>
    </form>
  );
}
TS

write components/HotelsList.tsx <<'TS'
"use client";
export default function HotelsList({ items }: { items: any[] }) {
  if (!items || items.length===0) return (
    <div className="rounded-xl border bg-white p-6 text-gray-600">No hotels found for this destination yet.</div>
  );
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((h:any,i:number)=>{
        const mapUrl = h.location
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.location)}`
          : h.gmaps || h.maps_url || null;
        return (
          <article key={h.place_id || h.id || i} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-start justify-between">
              <h3 className="line-clamp-1 text-lg font-semibold">{h.name || "Hotel"}</h3>
              {h.rating ? <span className="rounded-full border px-2 py-0.5 text-xs">⭐ {h.rating}{h.user_ratings_total?` (${h.user_ratings_total})`:""}</span> : null}
            </div>
            <p className="line-clamp-2 text-sm text-gray-600">{h.vicinity || h.address || h.location || ""}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {h.bcs?.total!==undefined && (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">BCS {h.bcs.total}</span>
              )}
              {h.bcs?.pace && <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">{h.bcs.pace}</span>}
            </div>
            <div className="mt-3">
              {mapUrl ? <a target="_blank" rel="noreferrer" href={mapUrl} className="inline-block rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">Open in Google Maps</a> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
TS

write components/KBInsights.tsx <<'TS'
"use client";
let CITY_DB:any[]=[]; try{ CITY_DB=require("@/data/city_profiles.json"); }catch{ CITY_DB=[]; }
function Chip({children}:{children:React.ReactNode}){ return <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">{children}</span>; }
export default function KBInsights({ city }:{ city?: string|null }){
  const name=(city||"").toString().toLowerCase(); if(!name) return null;
  const rec=(CITY_DB||[]).find((c:any)=>{ const n=(c?.name||"").toLowerCase(); return n===name || n.includes(name); })||null;
  if(!rec) return null;
  const tags:Array<string>=Array.isArray(rec.tags)?rec.tags:[]; const notes:Array<string>=Array.isArray(rec.notes)?rec.notes:[];
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-gray-800">City insights — {rec.name}</h3>
      {tags.length>0 && <div className="mb-2 flex flex-wrap gap-2">{tags.map((t:string)=><Chip key={t}>{t}</Chip>)}</div>}
      {notes.length>0 && <ul className="list-disc pl-5 text-xs text-gray-700">{notes.slice(0,3).map((n,i)=><li key={i}>{n}</li>)}</ul>}
    </section>
  );
}
TS

# 4) Lib (live BCS)
write lib/bcsEngine.ts <<'TS'
export type BCSInputs = {
  hotel: { rating?: number; user_ratings_total?: number; price_level?: number; types?: string[]; name?: string; };
  cityMod?: { transit_ease?: number; stroller?: number; heat_risk?: number; noise?: number; };
  ageBand: "0-3m"|"4-6m"|"7-12m"|"1-3y";
  directOnly: boolean;
};
export type BCS = { total: number; pace: "Easy"|"Moderate"|"Active"; napBlocks: number; breakdown: {label:string;score:number}[]; };
const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
export function computeBCS(input: BCSInputs): BCS {
  const { hotel, cityMod={}, ageBand, directOnly } = input;
  const rating=hotel.rating??4.0, volume=hotel.user_ratings_total??50, price=hotel.price_level, types=(hotel.types??[]).map(t=>t.toLowerCase()), name=(hotel.name??"").toLowerCase();
  const napBlocks = ageBand==="0-3m"||ageBand==="4-6m"?3:ageBand==="7-12m"?2:1;
  const volBoost = volume>=1000?10:volume>=200?6:volume>=50?3:0;
  let hygieneHotel = clamp((rating-3.5)*20 + 70 + volBoost, 40, 100);
  const cm={ transit_ease:cityMod.transit_ease??70, stroller:cityMod.stroller??70, heat_risk:cityMod.heat_risk??30, noise:cityMod.noise??40 };
  const hygieneCity = clamp(60 + (cm.stroller-50)*0.3 + (cm.transit_ease-50)*0.2 - (cm.heat_risk-30)*0.25 - (cm.noise-40)*0.15, 30, 95);
  const hygiene=Math.round(hygieneHotel*0.55 + hygieneCity*0.45);
  let accessHotel=70; if(price!==undefined) accessHotel+=(price*5); if(types.includes("hostel")||name.includes("hostel")) accessHotel-=15; if(types.includes("apartment")) accessHotel-=5;
  const accessCity = clamp(65 + (cm.transit_ease-50)*0.5 + (cm.stroller-50)*0.5, 40, 95);
  const accessibility=Math.round(clamp(accessHotel,40,90)*0.6 + accessCity*0.4);
  const namePenalty=["party","club","hostel","bar"].some(w=>name.includes(w))?15:0;
  let quietHotel=65 + (price!==undefined ? price*6 : 0) - namePenalty; if(types.includes("resort")) quietHotel-=5;
  const quietCity=clamp(70 - (cm.noise-40)*0.6 - (cm.heat_risk-30)*0.2, 35, 90);
  const lowStim=Math.round(clamp(quietHotel,35,90)*0.55 + quietCity*0.45);
  const travelAdj=directOnly?0:-6;
  const total=clamp(Math.round(hygiene*0.4 + accessibility*0.3 + lowStim*0.3 + travelAdj),20,99);
  const pace= napBlocks>=3?"Easy":napBlocks===2?"Moderate":"Active";
  return { total, pace, napBlocks, breakdown:[ {label:"Hygiene",score:hygiene},{label:"Accessibility",score:accessibility},{label:"Low-stimulation",score:lowStim} ] };
}
export default computeBCS;
TS

# 5) Minimal data to build
write data/city_profiles.json <<'JSON'
[
  { "name":"Paris, France","country":"France","tags":["stroller-friendly","cribs-common","walkable"],
    "areas":["Le Marais","Latin Quarter","Saint-Germain","Canal Saint-Martin"],
    "notes":["Many hotels provide travel cots on request.","Buses easier than metro for strollers.","Playgrounds: Luxembourg, Monceau."]},
  { "name":"Tokyo, Japan","country":"Japan","tags":["ultra-clean","quiet-evenings","great-parks"],
    "areas":["Ueno","Asakusa","Odaiba","Meguro"],
    "notes":["Nursing rooms in malls/stations.","Elevators crowded in rush hours."]}
]
JSON

# 6) Live-first API (falls back only if absolutely needed)
write app/api/hotels/route.ts <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { computeBCS } from "@/lib/bcsEngine";
const KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
async function geocode(q:string){
  const u=`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${KEY}`;
  const r=await fetch(u); const j:any=await r.json(); return j.results?.[0] ? {lat:j.results[0].geometry.location.lat,lng:j.results[0].geometry.location.lng} : null;
}
async function nearby(lat:number,lng:number,radius=3500){
  const u=`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=lodging&key=${KEY}`;
  const r=await fetch(u); const j:any=await r.json(); return j.results||[];
}
export async function GET(req: NextRequest){
  const url=new URL(req.url);
  const lat=parseFloat(url.searchParams.get("lat")||"NaN");
  const lng=parseFloat(url.searchParams.get("lng")||"NaN");
  const city=url.searchParams.get("city")||url.searchParams.get("to")||"";
  const limit=parseInt(url.searchParams.get("limit")||"12");
  const radius=parseInt(url.searchParams.get("radius")||"3500");
  const age=(url.searchParams.get("childAge")||"7-12m") as any;
  const directOnly=(url.searchParams.get("directOnly")||"true")==="true";
  try{
    let L=lat,G=lng;
    if(!Number.isFinite(L)||!Number.isFinite(G)){
      if(!KEY) throw new Error("No coords and no API key");
      const g=await geocode(city||"Paris, France"); if(!g) throw new Error("Geocode failed");
      L=g.lat; G=g.lng;
    }
    const results= await nearby(L,G,radius);
    const enriched=results.map((h:any)=>({
      ...h,
      bcs: computeBCS({
        hotel:{ rating:h.rating,user_ratings_total:h.user_ratings_total,price_level:h.price_level,types:h.types,name:h.name },
        ageBand: age, directOnly
      })
    })).sort((a:any,b:any)=> (b.bcs?.total??0)-(a.bcs?.total??0));
    return NextResponse.json({ items: enriched.slice(0,limit), live: true });
  }catch(e:any){
    return NextResponse.json({ error:e.message||"failed", items:[] }, { status: 500 });
  }
}
TS

# 7) Results page + view
write app/(site)/results/page.tsx <<'TSX'
import ResultsView from "@/components/ResultsView";
export default async function ResultsPage({ searchParams }: { searchParams: any }) {
  return <ResultsView searchParams={searchParams} />;
}
TSX

write components/ResultsView.tsx <<'TSX'
import Tabs from "@/components/Tabs";
import ResultsHeader from "@/components/ResultsHeader";
import HotelsList from "@/components/HotelsList";
import HotelsFilter from "@/components/HotelsFilter";
import KBInsights from "@/components/KBInsights";
const one=(v:any,d="")=>Array.isArray(v)?(v[0]??d):(v??d);
const toN=(s?:string)=>{ const n=Number(s); return Number.isFinite(n)?n:undefined; };
async function hotelsAPI(q:Record<string,string>){
  const base=process.env.NEXT_PUBLIC_BASE_URL||"";
  const p=new URLSearchParams();
  const keys=["lat","lng","to","city","radius","limit","keyword","childAge","directOnly"];
  for(const k of keys){ if(q[k]) p.set(k,q[k]); }
  const r=await fetch(`${base}/api/hotels?${p.toString()}`,{ cache:"no-store" }); if(!r.ok) return {items:[],live:false};
  return r.json();
}
export default async function ResultsView({ searchParams }:{ searchParams: Record<string,string|string[]|undefined> }){
  const q=Object.fromEntries(Object.entries(searchParams||{}).map(([k,v])=>[k, one(v,"")]));
  const fromText=q.from||"Origin"; const toText=q.to||"Destination";
  const depart=q.depart||"—"; const ret=q.ret||"—";
  const age=q.childAge||"7-12m"; const travellers=q.travellers||"2";
  const directOnly=(q.directOnly||"true")==="true";
  const lat=toN(q.lat); const lng=toN(q.lng);
  const coords = lat!==undefined && lng!==undefined ? {lat,lng} : null;
  const gmapsUrl = coords ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}` : null;
  const { items, live } = await hotelsAPI(q);
  const tabs=[ {id:"itinerary",label:"Itinerary"}, {id:"hotels",label:"Hotels"}, {id:"safety",label:"Safety"} ];
  return (
    <section className="mx-auto max-w-6xl space-y-4 p-4">
      <ResultsHeader title={`Results — ${toText}`} subtitle={`From ${fromText} · Depart ${depart} · Return ${ret} · Travellers ${travellers} · Age ${age} · ${directOnly?"Direct only":"Any flights"}`} gmapsUrl={gmapsUrl} coords={coords as any} />
      <Tabs tabs={tabs}>
        <div className="rounded-2xl border bg-white p-4 text-gray-700">Itinerary view (M2) will render here.</div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-gray-100 px-2 py-1">{live?"live":"seed"}</span>
          </div>
          <HotelsFilter defaultCity={toText} hasLatLng={Boolean(coords)} />
          <KBInsights city={toText} />
          <div className="rounded-2xl border bg-white p-4"><HotelsList items={items} /></div>
        </div>
        <div className="rounded-2xl border bg-white p-4 text-gray-700">Safety list (M4) to plug next.</div>
      </Tabs>
    </section>
  );
}
TSX

echo "→ Done."
echo
echo "NEXT:"
echo "  1) export GOOGLE_MAPS_API_KEY=YOUR_KEY"
echo "  2) rm -rf .next && npm run dev"
echo "  3) Open: /results?to=Paris,%20France&childAge=7-12m&directOnly=true&radius=3500&limit=12"
