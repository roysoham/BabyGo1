// components/HotelsTab.tsx
"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import HotelsCard from "@/components/HotelsCard";

type Item = {
  name: string;
  address?: string;
  rating?: number | null;
  ratings?: number | null;
  priceLevel?: number | null;
  maps_url?: string | null;
  grade?: "A"|"B"|"C"|"D";
  score?: number | null; // server score (0..100)
  hints?: { likelyCribs?: boolean };
};

function tanh(x:number){ return Math.tanh(x); }
function reviewsScore(count?: number | null){ if(!count) return 0.2; return tanh((count||0)/500); }
function priceLevelScore(level?: number | null){
  if (level == null) return 0.6;
  const map: Record<number, number> = { 0: 1.0, 1: 1.0, 2: 0.75, 3: 0.5, 4: 0.25 };
  return map[level] ?? 0.6;
}
function weightsForAge(age: string){
  const a = age.toLowerCase();
  if (a.startsWith("0-3") || a.startsWith("0–3") || a.startsWith("0—3")) return { rating: 0.35, reviews: 0.20, price: 0.15, crib: 0.30 };
  if (a.startsWith("4-6") || a.startsWith("4–6") || a.startsWith("4—6")) return { rating: 0.38, reviews: 0.22, price: 0.15, crib: 0.25 };
  if (a.startsWith("7-12")) return { rating: 0.40, reviews: 0.25, price: 0.15, crib: 0.20 };
  // 1-3y / 3-5y
  return { rating: 0.45, reviews: 0.30, price: 0.15, crib: 0.10 };
}

function makeBreakdown(h: Item, age: string){
  const w = weightsForAge(age);
  const sr = Math.max(0, Math.min(1, (h.rating ?? 0) / 5));        // 0..1
  const sv = reviewsScore(h.ratings ?? null);                       // 0..1
  const sp = priceLevelScore(h.priceLevel ?? null);                 // 0..1
  const sc = h.hints?.likelyCribs ? 1 : 0;                          // 0..1

  // points scaled to 0..100 for display parity with server score
  const ratingPts = w.rating * sr * 100;
  const reviewPts = w.reviews * sv * 100;
  const pricePts  = w.price  * sp * 100;
  const cribPts   = w.crib   * sc * 100;

  const scoreApprox = Math.round(ratingPts + reviewPts + pricePts + cribPts);

  const breakdown = [
    { label: "Rating quality", weight: w.rating, value: sr, points: ratingPts },
    { label: "Reviews volume", weight: w.reviews, value: sv, points: reviewPts },
    { label: "Price fit",      weight: w.price,  value: sp, points: pricePts },
    { label: "Crib hint",      weight: w.crib,   value: sc, points: cribPts },
  ];

  return { scoreApprox, breakdown };
}

export default function HotelsTab(){
  const sp = useSearchParams();
  const lat = sp.get("lat") ? Number(sp.get("lat")) : undefined;
  const lng = sp.get("lng") ? Number(sp.get("lng")) : undefined;
  const minRating = sp.get("minRating") || "";
  const maxPrice  = sp.get("maxPrice") || "";
  const cribOnly  = sp.get("cribOnly") === "true";
  const q         = sp.get("q") || "";
  const age       = sp.get("childAge") || sp.get("age") || "7-12m";
  const radius    = sp.get("radius") || "5000";

  const [loading, setLoading] = React.useState(false);
  const [items, setItems]     = React.useState<Item[]>([]);
  const [err, setErr]         = React.useState<string|null>(null);

  React.useEffect(()=>{
    async function load(){
      if (lat == null || lng == null) { setItems([]); return; }
      setLoading(true); setErr(null);
      try{
        const p = new URLSearchParams({ lat:String(lat), lng:String(lng), radius, age });
        if (minRating) p.set("minRating", minRating);
        if (maxPrice)  p.set("maxPrice",  maxPrice);
        if (cribOnly)  p.set("cribOnly",  "true");
        if (q)         p.set("q",         q);

        const r = await fetch(`/api/hotels?${p.toString()}`, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        setItems(data.items || []);
      }catch(e:any){
        setErr(e?.message || "Failed to load hotels");
      }finally{
        setLoading(false);
      }
    }
    load();
  }, [lat, lng, minRating, maxPrice, cribOnly, q, radius, age]);

  if (lat == null || lng == null) return <p className="text-sm text-slate-600">Select a destination (or use a supported city) to see hotels.</p>;
  if (loading) return <p className="text-sm text-slate-600">Loading hotels…</p>;
  if (err) return <p className="text-sm text-red-600">Error: {err}</p>;
  if (!items.length) return <p className="text-sm text-slate-600">No hotels found for this destination yet.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((h, i) => {
        const { scoreApprox, breakdown } = makeBreakdown(h, String(age));
        return (
          <HotelsCard
            key={`${h.maps_url || h.name}-${i}`}
            name={h.name}
            address={h.address}
            rating={h.rating ?? null}
            ratings={h.ratings ?? null}
            priceLevel={h.priceLevel ?? null}
            maps_url={h.maps_url || null}
            grade={h.grade}
            score={typeof h.score === "number" ? h.score : scoreApprox}
            badges={[
              ...(h.hints?.likelyCribs ? ["Cribs"] : []),
              ...(q ? [`Match: ${q}`] : []),
            ]}
            breakdown={breakdown}
          />
        );
      })}
    </div>
  );
}