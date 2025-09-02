export type HotelItem = {
  name: string;
  rating?: number | null;
  ratings?: number | null;
  priceLevel?: number | null;
  address?: string;
  maps_url?: string | null;
  hints?: { likelyCribs?: boolean };
};

export default function HotelsList({ items }:{ items: HotelItem[] }){
  if (!items || items.length === 0) return <p className="text-sm text-gray-600">No hotels found for this destination yet.</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((h,i)=>(
        <div key={i} className="rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{h.name}</div>
            {h.rating != null ? <div className="text-xs">⭐ {h.rating} ({h.ratings ?? 0})</div> : null}
          </div>
          {h.address ? <div className="text-xs text-gray-600">{h.address}</div> : null}
          <div className="mt-1 text-xs">
            {h.priceLevel != null ? `Price level: ${"₹$€£".slice(0, Math.max(1, Math.min(4, Number(h.priceLevel))))}` : "Price level: —"}
            {h.hints?.likelyCribs ? " · Likely provides cribs" : ""}
          </div>
          {h.maps_url ? <a target="_blank" className="text-xs text-indigo-700 hover:underline" href={h.maps_url}>View on Google Maps</a> : null}
        </div>
      ))}
    </div>
  );
}
