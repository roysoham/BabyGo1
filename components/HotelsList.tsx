// components/HotelsList.tsx
type HotelItem = {
  name: string;
  address?: string;
  rating?: number;
  priceLevel?: number | string | null;
  maps_url?: string;
  hints?: { likelyCribs?: boolean } | null;
  matchTags?: string[];      // optional: display tiny chips
  bcsTag?: string;           // optional: tiny BCS chip text
};

export default function HotelsList({ items }: { items: HotelItem[] | any }) {
  const list: HotelItem[] = Array.isArray(items) ? items : [];

  if (!list.length) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        No hotels found for this destination yet.
      </div>
    );
  }

  const formatPrice = (p: HotelItem["priceLevel"]) =>
    p === null || p === undefined || p === "" ? "—" : String(p);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {list.map((h, idx) => (
        <article
          key={`${h.name}-${idx}`}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">{h.name}</h3>
              {h.address ? (
                <p className="mt-0.5 text-sm text-gray-600">{h.address}</p>
              ) : null}
            </div>

            {/* tiny BCS chip if provided */}
            {h.bcsTag ? (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {h.bcsTag}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
            <span>⭐ {h.rating ?? "—"}</span>
            <span>Price: {formatPrice(h.priceLevel)}</span>
            {h.hints?.likelyCribs ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Cribs likely
              </span>
            ) : null}
            {h.matchTags?.length
              ? h.matchTags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs"
                  >
                    {t}
                  </span>
                ))
              : null}
          </div>

          <div className="mt-3">
            {h.maps_url ? (
              <a
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                href={h.maps_url}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            ) : (
              <span className="text-xs text-gray-500">
                Google Maps link unavailable
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}