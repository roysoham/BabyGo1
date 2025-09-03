// components/HotelsCard.tsx
import React from "react";

type Props = {
  name: string;
  address?: string;
  rating?: number | null;
  ratings?: number | null;
  priceLevel?: number | null;
  maps_url?: string | null;
  grade?: "A"|"B"|"C"|"D";
  score?: number | null;
  badges?: string[];
};

function PriceDots({ level }:{ level: number | null | undefined }){
  if (level == null) return <span className="text-xs text-gray-500">—</span>;
  const dots = ["$", "$$", "$$$", "$$$$"].slice(0, Math.min(4, Math.max(1, Number(level))));
  return <span className="text-xs">{dots.join("")}</span>;
}

export default function HotelsCard({
  name, address, rating, ratings, priceLevel, maps_url, grade, score, badges = []
}: Props){
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-white/70 p-4 shadow-sm transition hover:shadow-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500"></div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">{name}</h3>
          {address ? <p className="mt-0.5 truncate text-sm text-slate-600">{address}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {typeof score === "number" && grade ? (
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
              BCS {grade} · {score}
            </span>
          ) : null}
          {typeof rating === "number" ? (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
              ⭐ {rating.toFixed(1)}{typeof ratings === "number" ? ` (${ratings})` : ""}
            </span>
          ) : null}
        </div>
      </div>
      {badges.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {badges.map((b, i)=>(
            <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 ring-1 ring-slate-200">
              {b}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="rounded bg-slate-50 px-1.5 py-0.5 ring-1 ring-slate-200">
            <PriceDots level={priceLevel} />
          </span>
        </div>
        {maps_url ? (
          <a href={maps_url} target="_blank" rel="noreferrer"
             className="rounded-lg bg-indigo-600 px-2.5 py-1 font-medium text-white shadow-sm transition hover:bg-indigo-700">
            Open in Google Maps
          </a>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent transition group-hover:ring-indigo-200"></div>
    </div>
  );
}
