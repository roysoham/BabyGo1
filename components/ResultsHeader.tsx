// components/ResultsHeader.tsx
type Props = {
  title: string;
  subtitle?: string;
  coords?: { lat: number; lng: number } | null;
};

export default function ResultsHeader({ title, subtitle, coords }: Props) {
  const mapsHref =
    coords ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}` : null;

  return (
    <header className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          ) : null}
        </div>

        {mapsHref ? (
          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            aria-label="Open destination in Google Maps"
          >
            Open in Google Maps
          </a>
        ) : null}
      </div>
    </header>
  );
}