"use client";
export default function ResultsHeader({
  title,
  subtitle,
  coords,
  children,
}: {
  title: string;
  subtitle: string;
  coords?: { lat: number; lng: number } | null;
  children?: React.ReactNode;
}) {
  const goMaps = () => {
    if (!coords) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <header className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        {coords ? (
          <button
            onClick={goMaps}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Open in Google Maps
          </button>
        ) : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </header>
  );
}
