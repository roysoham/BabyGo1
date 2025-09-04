// components/ResultsHeader.tsx
export default function ResultsHeader({
  title,
  subtitle,
  coords,
}: {
  title: string;
  subtitle: string;
  coords?: { lat: number; lng: number } | null;
}) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>{subtitle}</span>
        {coords ? (
          <a
            className="rounded-full border px-2 py-1 hover:bg-gray-50"
            href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
        ) : null}
      </div>
    </header>
  );
}
