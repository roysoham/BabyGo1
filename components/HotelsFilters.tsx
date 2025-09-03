// components/HotelsFilters.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

export default function HotelsFilters(){
  const router = useRouter();
  const sp = useSearchParams();
  const [minRating, setMinRating] = React.useState(sp.get("minRating") || "");
  const [maxPrice, setMaxPrice]   = React.useState(sp.get("maxPrice") || "");
  const [cribOnly, setCribOnly]   = React.useState(sp.get("cribOnly") === "true");
  const [q, setQ]                 = React.useState(sp.get("q") || "");
  React.useEffect(()=>{
    setMinRating(sp.get("minRating") || "");
    setMaxPrice(sp.get("maxPrice") || "");
    setCribOnly(sp.get("cribOnly") === "true");
    setQ(sp.get("q") || "");
  }, [sp]);
  function apply(){
    const p = new URLSearchParams(sp.toString());
    minRating ? p.set("minRating", minRating) : p.delete("minRating");
    maxPrice ? p.set("maxPrice", maxPrice) : p.delete("maxPrice");
    cribOnly ? p.set("cribOnly", "true") : p.delete("cribOnly");
    q ? p.set("q", q) : p.delete("q");
    router.push(`?${p.toString()}`);
  }
  function reset(){
    const p = new URLSearchParams(sp.toString());
    ["minRating","maxPrice","cribOnly","q"].forEach(k=>p.delete(k));
    router.push(`?${p.toString()}`);
  }
  return (
    <div className="mb-3 grid grid-cols-1 gap-2 rounded-2xl border bg-white/70 p-3 shadow-sm md:grid-cols-5">
      <div className="flex flex-col">
        <label className="text-xs text-slate-600">Min rating</label>
        <select value={minRating} onChange={(e)=>setMinRating(e.target.value)} className="rounded-lg border px-2 py-1">
          <option value="">Any</option>
          <option value="4.5">4.5+</option>
          <option value="4.2">4.2+</option>
          <option value="4.0">4.0+</option>
          <option value="3.5">3.5+</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-slate-600">Max price level</label>
        <select value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} className="rounded-lg border px-2 py-1">
          <option value="">Any</option>
          <option value="1">$</option>
          <option value="2">$$</option>
          <option value="3">$$$</option>
          <option value="4">$$$$</option>
        </select>
      </div>
      <label className="flex items-end gap-2">
        <input type="checkbox" checked={cribOnly} onChange={(e)=>setCribOnly(e.target.checked)} />
        <span className="text-sm">Cribs likely</span>
      </label>
      <div className="flex flex-col md:col-span-2">
        <label className="text-xs text-slate-600">Keyword</label>
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="kitchenette, family room, quiet..." className="rounded-lg border px-2 py-1" />
      </div>
      <div className="flex gap-2 md:col-span-5">
        <button onClick={apply} className="rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">Apply</button>
        <button onClick={reset} className="rounded-xl border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Reset</button>
      </div>
    </div>
  );
}
