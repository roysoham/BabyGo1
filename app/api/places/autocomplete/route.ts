// app/api/places/autocomplete/route.ts
import { NextResponse } from "next/server";
import { Client } from "@googlemaps/google-maps-services-js";
import { findCityByName } from "@/lib/fallbackCities";

/**
 * q: partial city text
 * Returns up to 6 suggestions. Falls back to local KB if Google fails or is not configured.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  // Empty query? return none quickly
  if (!q) return NextResponse.json([]);

  // Try Google first (if key provided)
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (key) {
    try {
      const client = new Client({});
      const r = await client.placeAutocomplete({
        params: { input: q, types: "(cities)", key },
        timeout: 3000,
      });

      const items =
        (r.data?.predictions || []).map((p) => ({
          place_id: p.place_id,
          description: p.description,
        })) ?? [];

      // If Google returned something, use that
      if (items.length > 0) return NextResponse.json(items.slice(0, 6));
    } catch {
      // swallow and try fallback
    }
  }

  // Fallback: local KB (best-effort)
  const hit = findCityByName(q);
  if (hit) {
    return NextResponse.json([
      { place_id: hit.name, description: hit.name },
    ]);
  }

  return NextResponse.json([]);
}