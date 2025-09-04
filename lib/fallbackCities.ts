import list from "../data/cities_fallback.min.json";

export type FCity = { name: string; lat: number; lng: number };

// Cast JSON list to proper type
const cities: FCity[] = list as FCity[];

// Export cities for default import
export default cities;

// Utility: find city by name
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