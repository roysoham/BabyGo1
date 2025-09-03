// app/api/safety/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = Number(searchParams.get("radius") || 3000);
  if (!lat || !lng) return NextResponse.json({ items: [] });

  const key = process.env.GOOGLE_MAPS_API_KEY!;
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=hospital|pharmacy|doctor&keyword=pediatric&key=${key}`;

  const r = await fetch(url);
  const json = await r.json();
  const items = (json.results || []).slice(0, 20).map((p: any) => ({
    type: p.types?.[0] ?? "clinic",
    name: p.name,
    address: p.vicinity ?? p.formatted_address,
    rating: p.rating ?? null,
    maps_url: p.place_id ? `https://www.google.com/maps/place/?q=place_id:${p.place_id}` : null,
  }));
  return NextResponse.json({ items });
}