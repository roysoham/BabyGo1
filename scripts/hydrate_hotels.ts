// scripts/hydrate_hotels.ts
/**
 * Hydrates seed data for top cities using Google Places.
 * For each city: resolve lat/lng, fetch hotels, compute BCS, keep top 10+.
 *
 * Requires:
 *   export GOOGLE_MAPS_API_KEY=xxxx
 *
 * Run:
 *   ts-node scripts/hydrate_hotels.ts
 * Output:
 *   data/hotels_seed.json
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import cities from "@/data/cities_top100.json";
import { computeBCS } from "@/lib/bcsEngine";

const KEY = process.env.GOOGLE_MAPS_API_KEY || "";
if (!KEY) { console.error("GOOGLE_MAPS_API_KEY missing"); process.exit(1); }

type NearbyResult = {
  name: string;
  place_id: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  vicinity?: string;
};

async function geocodeCity(q: string){
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${KEY}`;
  const r = await fetch(url); const j:any = await r.json();
  const p = j.results?.[0];
  if (!p) return null;
  return { lat: p.geometry.location.lat, lng: p.geometry.location.lng, place_id: p.place_id };
}

async function hotelsNear(lat:number,lng:number, radius=5000, max=60): Promise<NearbyResult[]>{
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=lodging&key=${KEY}`;
  const out: NearbyResult[] = [];
  for(let page=0; page<3 && out.length<max; page++){
    const r = await fetch(url); const j:any = await r.json();
    for (const x of (j.results||[])){
      out.push({
        name: x.name, place_id: x.place_id, rating: x.rating,
        user_ratings_total: x.user_ratings_total, price_level: x.price_level, types: x.types, vicinity: x.vicinity
      });
    }
    if (j.next_page_token){ await new Promise(res=>setTimeout(res, 2000)); url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${j.next_page_token}&key=${KEY}`; }
    else break;
  }
  return out;
}

async function cityModifiers(city: string){
  // Light heuristics: tweak by region keywords. You can expand this mapping later.
  const s = city.toLowerCase();
  const hot = /(dubai|doha|abu dhabi|bangkok|kuala lumpur|phuket|singapore|manila|muscat)/.test(s);
  const noisy = /(new york|bangkok|barcelona|rio|istanbul|ho chi minh|madrid)/.test(s);
  const strollerGood = /(tokyo|singapore|vancouver|copenhagen|amsterdam|vienna|zurich|munich)/.test(s);
  return {
    transit_ease: strollerGood ? 85 : noisy ? 60 : 70,
    stroller: strollerGood ? 85 : 70,
    heat_risk: hot ? 70 : 30,
    noise: noisy ? 65 : 40
  };
}

async function run(){
  const out:any = {};
  for (const city of (cities as string[])){
    try{
      const g = await geocodeCity(city);
      if (!g){ console.warn("No geocode", city); continue; }
      const mods = await cityModifiers(city);
      const hotels = await hotelsNear(g.lat, g.lng);
      const enriched = hotels.map(h=>{
        const bcs = computeBCS({ hotel: h, cityMod: mods, ageBand: "7-12m", directOnly: true });
        return { city, coords:{lat:g.lat,lng:g.lng}, ...h, bcs };
      }).sort((a,b)=> b.bcs.total - a.bcs.total);

      out[city] = enriched.slice(0, Math.max(10, Math.min(20, enriched.length)));
      console.log(city, "→", out[city].length, "hotels");
    }catch(e){ console.error(city, e); }
  }
  fs.writeFileSync(path.join(process.cwd(),"data","hotels_seed.json"), JSON.stringify(out,null,2));
  console.log("Wrote data/hotels_seed.json");
}

run();