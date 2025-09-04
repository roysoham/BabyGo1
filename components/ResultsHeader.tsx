// PATCH 0313 — header with optional "Open in Google Maps" deep-link
export default function ResultsHeader({
  title,
  subtitle,
  coords,
}: {
  title: string;
  subtitle: string;
  coords: { lat: number; lng: number } | null;
}) {
  const gmaps =
    coords &&
    `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>
      {gmaps && (
        <a
          href={gmaps}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Open in Google Maps
        </a>
      )}
    </header>
  );
}