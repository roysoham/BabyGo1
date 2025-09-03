// app/api/hotels/route.ts
import { NextResponse } from "next/server";

// ---------- helpers ----------
function maskKey(u: string) {
  try {
    const x = new URL(u);
    if (x.searchParams.has("key")) x.searchParams.set("key", "****");
    return x.toString();
  } catch {
    return "n/a";
  }
}

function toItems(results: any[] = []) {
  return results.map((r: any) => ({
    name: r?.name ?? "",
    rating: r?.rating ?? null,
    ratings: r?.user_ratings_total ?? null,
    priceLevel: r?.price_level ?? null,
    address: r?.vicinity || r?.formatted_address || "",
    place_id: r?.place_id ?? null,
    location: r?.geometry?.location ?? null,
    maps_url: r?.place_id
      ? `https://www.google.com/maps/place/?q=place_id:${r.place_id}`
      : null,
    hints: {
      likelyCribs: /family|baby|kids|child|crib|cot/i.test(
        `${r?.name ?? ""} ${(r?.types || []).join(" ")}`
      ),
    },
  }));
}

async function fetchJson(url: URL) {
  const res = await fetch(url.toString(), { cache: "no-store" });
  let data: any = {};
  try {
    data = await res.json();
  } catch {}
  return { ok: res.ok, data, status: res.status, url: maskKey(url.toString()) };
}

function dedupeByPlaceId(arr: any[]) {
  const seen = new Set<string>();
  return arr.filter((x) => {
    const id = x.place_id || x.maps_url || x.name;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// ---------- API ----------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius") || "5000"; // meters
    const kwOverride = searchParams.get("keyword") || ""; // optional override

    if (!lat || !lng) {
      return NextResponse.json(
        { items: [], debug: { note: "lat and lng required" } },
        { status: 400 }
      );
    }

    const key =
      process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_KEY || "";
    if (!key) {
      return NextResponse.json(
        {
          items: [],
          debug: {
            note:
              "Missing GOOGLE_MAPS_API_KEY (or GOOGLE_PLACES_KEY) in .env.local",
          },
        },
        { status: 500 }
      );
    }

    // inside your GET() just before fetch(...) call
    async function tryQuery(q: string) {
      const resp = await fetch(q);
        const data = await resp.json();
          return data?.results ?? [];
          }

          const base = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=lodging&key=${key}`;
          let results = await tryQuery(`${base}&keyword=family+baby+crib+cot+kids+child+friendly`);
          if (results.length === 0) results = await tryQuery(`${base}&keyword=family+baby`);
          if (results.length === 0) results = await tryQuery(base);

    const attempts: any[] = [];
    const collected: any[] = [];

    // Attempt 1: Nearby (lodging + baby keywords)
    const a1 = new URL(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    );
    a1.searchParams.set("location", `${lat},${lng}`);
    a1.searchParams.set("radius", radius);
    a1.searchParams.set("type", "lodging");
    a1.searchParams.set(
      "keyword",
      kwOverride || "family baby crib cot kids child friendly"
    );
    a1.searchParams.set("key", key);
    let r1 = await fetchJson(a1);
    attempts.push({ kind: "nearby+babyKeywords", status: r1.data?.status, url: r1.url, count: r1.data?.results?.length ?? 0 });
    if (r1.ok && r1.data?.results?.length) collected.push(...r1.data.results);

    // Attempt 2: Nearby (lodging only)
    if (collected.length === 0) {
      const a2 = new URL(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
      );
      a2.searchParams.set("location", `${lat},${lng}`);
      a2.searchParams.set("radius", radius);
      a2.searchParams.set("type", "lodging");
      a2.searchParams.set("key", key);
      let r2 = await fetchJson(a2);
      attempts.push({ kind: "nearby+lodgingOnly", status: r2.data?.status, url: r2.url, count: r2.data?.results?.length ?? 0 });
      if (r2.ok && r2.data?.results?.length) collected.push(...r2.data.results);
    }

    // Attempt 3: Nearby (keyword=hotel)
    if (collected.length === 0) {
      const a3 = new URL(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
      );
      a3.searchParams.set("location", `${lat},${lng}`);
      a3.searchParams.set("radius", radius);
      a3.searchParams.set("keyword", "hotel");
      a3.searchParams.set("key", key);
      let r3 = await fetchJson(a3);
      attempts.push({ kind: "nearby+keyword=hotel", status: r3.data?.status, url: r3.url, count: r3.data?.results?.length ?? 0 });
      if (r3.ok && r3.data?.results?.length) collected.push(...r3.data.results);
    }

    // Attempt 4: Text Search (“hotels near lat,lng”)
    if (collected.length === 0) {
      const a4 = new URL(
        "https://maps.googleapis.com/maps/api/place/textsearch/json"
      );
      a4.searchParams.set("query", `hotels near ${lat},${lng}`);
      a4.searchParams.set("key", key);
      let r4 = await fetchJson(a4);
      attempts.push({ kind: "textsearch+hotelsNear", status: r4.data?.status, url: r4.url, count: r4.data?.results?.length ?? 0 });
      if (r4.ok && r4.data?.results?.length) collected.push(...r4.data.results);
    }

    const deduped = dedupeByPlaceId(collected);
    const items = toItems(deduped);

    return NextResponse.json(
      {
        items,
        debug: {
          attempts,
          finalCount: items.length,
          queryEcho: { lat, lng, radius, keywordUsed: kwOverride || "auto" },
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        items: [],
        debug: { note: "Unhandled error", message: String(e?.message || e) },
      },
      { status: 500 }
    );
  }
}