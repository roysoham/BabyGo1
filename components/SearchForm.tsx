"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Suggestion = { place_id: string; description: string };
const AGE = ["0-3m","4-6m","7-12m","1-3y","3-5y"] as const;
type Age = typeof AGE[number];

function useDebouncedCallback(cb: (...args:any[])=>void, delay=200){
  const t = useRef<NodeJS.Timeout|null>(null);
  return (...args:any[]) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(()=>cb(...args), delay);
  };
}

async function getSug(q: string): Promise<Suggestion[]> {
  if (!q || q.length < 2) return [];
  try {
    const r = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}`);
    if (!r.ok) return [];
    return await r.json();
  } catch {
    return [];
  }
}

export default function SearchForm(){
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [depart, setDepart] = useState("");
  const [ret, setRet] = useState("");
  const [travellers, setTravellers] = useState(2);
  const [childAge, setChildAge] = useState<Age>("7-12m");
  const [directOnly, setDirectOnly] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  const [fromSug, setFromSug] = useState<Suggestion[]>([]);
  const [toSug, setToSug] = useState<Suggestion[]>([]);
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const fromBox = useRef<HTMLDivElement|null>(null);
  const toBox = useRef<HTMLDivElement|null>(null);

  const debFrom = useDebouncedCallback(async (v:string)=> setFromSug(await getSug(v)), 220);
  const debTo   = useDebouncedCallback(async (v:string)=> setToSug(await getSug(v)), 220);

  useEffect(()=>{
    const onClick = (e: MouseEvent)=>{
      if (fromBox.current && !fromBox.current.contains(e.target as Node)) setOpenFrom(false);
      if (toBox.current && !toBox.current.contains(e.target as Node)) setOpenTo(false);
    };
    window.addEventListener("click", onClick);
    return ()=> window.removeEventListener("click", onClick);
  },[]);

  function onSubmit(e: React.FormEvent){
    e.preventDefault();
    setErr(null);
    if (!from || !to || !depart){ setErr("Please fill From, To and Depart date."); return; }
    if (ret && ret < depart){ setErr("Return date cannot be before Depart date."); return; }
    const q = new URLSearchParams({
      from, to, depart, ret, childAge,
      travellers: String(travellers),
      directOnly: String(directOnly),
    });
    if (fromId) q.set("fromId", fromId);
    if (toId) q.set("toId", toId);
    router.push(`/results?${q.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-6xl rounded-2xl border bg-white p-4 shadow">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        <div ref={fromBox} className="relative">
          <input className="w-full rounded-lg border px-3 py-2" placeholder="From (city/airport)"
                 value={from}
                 onFocus={()=>{setOpenFrom(true); debFrom(from);}}
                 onChange={(e)=>{ const v=e.target.value; setFrom(v); setFromId(""); debFrom(v);}}
          />
          {openFrom && fromSug.length>0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow">
              {fromSug.map(s=> (
                <div key={s.place_id}
                     className="cursor-pointer px-3 py-2 hover:bg-gray-50"
                     onClick={()=>{ setFrom(s.description); setFromId(s.place_id); setOpenFrom(false); }}>
                  {s.description}
                </div>
              ))}
            </div>
          )}
        </div>

        <div ref={toBox} className="relative">
          <input className="w-full rounded-lg border px-3 py-2" placeholder="To (city/airport)"
                 value={to}
                 onFocus={()=>{setOpenTo(true); debTo(to);}}
                 onChange={(e)=>{ const v=e.target.value; setTo(v); setToId(""); debTo(v);}}
          />
          {openTo && toSug.length>0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow">
              {toSug.map(s=> (
                <div key={s.place_id}
                     className="cursor-pointer px-3 py-2 hover:bg-gray-50"
                     onClick={()=>{ setTo(s.description); setToId(s.place_id); setOpenTo(false); }}>
                  {s.description}
                </div>
              ))}
            </div>
          )}
        </div>

        <input type="date" className="rounded-lg border px-3 py-2" value={depart} onChange={(e)=>setDepart(e.target.value)} aria-label="Depart date" />
        <input type="date" className="rounded-lg border px-3 py-2" value={ret} onChange={(e)=>setRet(e.target.value)} aria-label="Return date" />
        <select className="rounded-lg border px-3 py-2" value={childAge} onChange={(e)=>setChildAge(e.target.value as Age)}>
          {AGE.map(a=> <option key={a} value={a}>{a}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={directOnly} onChange={(e)=>setDirectOnly(e.target.checked)} /> Direct only
        </label>
        <label className="flex items-center gap-2 text-sm">
          Travellers <input type="number" min={1} max={8} className="w-20 rounded-lg border px-3 py-2" value={travellers} onChange={(e)=>setTravellers(parseInt(e.target.value||"1"))} />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        <button type="submit" className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2 font-semibold text-white shadow">Search</button>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </form>
  );
}
