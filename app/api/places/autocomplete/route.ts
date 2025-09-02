import { NextResponse } from "next/server";
import { Client } from "@googlemaps/google-maps-services-js";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  if (!q) return NextResponse.json([]);
  const client = new Client({});
  const key = process.env.GOOGLE_MAPS_API_KEY!;
  const r = await client.placeAutocomplete({ params: { input: q, types: "(cities)", key } });
  const items = (r.data.predictions||[]).map(p=>({ place_id:p.place_id, description:p.description }));
  return NextResponse.json(items.slice(0,6));
}
