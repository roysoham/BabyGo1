"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ageGroups = ["0-3m","4-6m","7-12m","1-3y","3-5y"] as const;
type AgeGroup = typeof ageGroups[number];

export default function SearchForm() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [depart, setDepart] = useState("");
  const [ret, setRet] = useState("");
  const [travellers, setTravellers] = useState(2);
  const [childAge, setChildAge] = useState<AgeGroup>("7-12m");
  const [directOnly, setDirectOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!from || !to || !depart) { setError("Please fill From, To and Depart date."); return; }
    if (ret && ret < depart) { setError("Return date cannot be before Depart date."); return; }
    const params = new URLSearchParams({ from, to, depart, ret, travellers: String(travellers), childAge, directOnly: String(directOnly) });
    router.push(`/results?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="sticky top-4 z-10 rounded-2xl border bg-white p-4 shadow">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        <input className="rounded-lg border px-3 py-2" placeholder="From (city/airport)" value={from} onChange={(e)=>setFrom(e.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="To (city/airport)" value={to} onChange={(e)=>setTo(e.target.value)} />
        <input type="date" className="rounded-lg border px-3 py-2" value={depart} onChange={(e)=>setDepart(e.target.value)} aria-label="Depart date" />
        <input type="date" className="rounded-lg border px-3 py-2" value={ret} onChange={(e)=>setRet(e.target.value)} aria-label="Return date" />
        <select className="rounded-lg border px-3 py-2" value={childAge} onChange={(e)=>setChildAge(e.target.value as AgeGroup)}>
          {ageGroups.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={directOnly} onChange={(e)=>setDirectOnly(e.target.checked)} /> Direct only
        </label>
        <label className="flex items-center gap-2 text-sm">
          Travellers <input type="number" min={1} max={8} className="w-20 rounded-lg border px-3 py-2" value={travellers} onChange={(e)=>setTravellers(parseInt(e.target.value || "1"))} />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        <button type="submit" className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2 font-semibold text-white shadow">Search</button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
