// lib/fallbackCities.ts
import list from "@/data/cities_fallback.min.json";

export type FCity = { name: string; lat: number; lng: number };
const cities = (list as FCity[]) ?? [];

export function findCityByName(q?: string): FCity | null {
  if (!q) return null;
  const s = q.toLowerCase().trim();
  return (
    cities.find(
      (c) =>
        c.name.toLowerCase() === s || c.name.toLowerCase().includes(s)
    ) || null
  );
}