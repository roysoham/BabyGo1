"use client";
export default function ResultsHeader({ title, subtitle, coords }:{ title:string; subtitle:string; coords?: {lat:number, lng:number} | null }){
  function onExport(){
    window.print();
  }
  const mapHref = coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : null;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-gray-600">{subtitle}</p>
        {coords ? <a className="text-xs text-indigo-700 hover:underline" target="_blank" href={mapHref ?? "#"}>Open in Google Maps</a> : null}
      </div>
      <div className="flex gap-2">
        <button onClick={onExport} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">Export PDF</button>
      </div>
    </div>
  );
}
