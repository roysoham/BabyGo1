// PATCH 0313 — Card grid with Google Maps buttons
type Item = {
  name: string;
  rating?: number;
  ratings?: number;
  address?: string;
  maps_url?: string;
  place_id?: string;
  priceLevel?: number | null;
  hints?: { likelyCribs?: boolean; likelyCribsPriceLevel?: number | null };
};

export default function HotelsList({ items }: { items: Item[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-gray-500">
        No hotels found for this destination yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((h, i) => (
        <div key={`${h.place_id || h.name}-${i}`} className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500" />
          <div className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-1 text-lg font-semibold">{h.name}</h3>
              {typeof h.rating === "number" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
                  ⭐ {h.rating.toFixed(1)}
                  {h.ratings ? <em className="not-italic opacity-70">({h.ratings})</em> : null}
                </span>
              )}
            </div>
            {h.address && (
              <p className="line-clamp-1 text-sm text-gray-600">{h.address}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {h.hints?.likelyCribs && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Match: Cribs</span>}
            </div>
            <div className="pt-2">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={
                  h.maps_url ||
                  (h.place_id
                    ? `https://www.google.com/maps/place/?q=place_id:${h.place_id}`
                    : undefined)
                }
                className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}