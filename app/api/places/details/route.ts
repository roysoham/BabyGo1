import { NextResponse } from "next/server";
import { Client } from "@googlemaps/google-maps-services-js";

export async function GET(req: Request) {
  const pid = new URL(req.url).searchParams.get("place_id");
  if (!pid) return NextResponse.json({ error: "missing" }, { status: 400 });
  const client = new Client({});
  const key = process.env.GOOGLE_MAPS_API_KEY!;
  const d = await client.placeDetails({ params: { place_id: pid, key } });
  const g = d.data.result.geometry?.location;
  const country = d.data.result.address_components?.find(c=>c.types.includes("country"))?.long_name;
  return NextResponse.json({ lat:g?.lat, lng:g?.lng, country });
}
