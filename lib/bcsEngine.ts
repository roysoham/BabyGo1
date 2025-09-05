// lib/bcsEngine.ts

export type BCSInputs = {
  hotel?: any;
  cityMod?: Partial<CityMod>;
  ageBand?: "0-6m" | "7-12m" | "13-24m" | "2-4y" | "5y+";
  directOnly?: boolean;
};

export type BCS = {
  total: number;                 // 0..100
  pace: "Slow" | "Moderate" | "Fast";
  napBlocks: number;             // suggested naps per day
  breakdown: { label: string; score: number }[];
};

export type CityMod = {
  stroller: number;   // 0..1
  hygiene: number;    // 0..1
  accessibility: number; // 0..1
  lowStim: number;    // 0..1
};

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/**
 * Defensive BCS calculator that NEVER throws when hotel fields are missing.
 * If hotel.* is undefined, we use sane defaults so UI always renders.
 */
export function computeBCS(input: BCSInputs): BCS {
  const { hotel = {}, cityMod = {}, ageBand, directOnly } = input;

  // --- Defensive defaults
  const rating: number = hotel.rating ?? 4.0;                   // 1..5
  const volume: number = hotel.user_ratings_total ?? 50;        // 0..∞
  const price: number = hotel.price_level ?? 2;                  // 0..4
  const types: string[] = (hotel.types ?? []).map((t: string) => String(t).toLowerCase());

  // City modifiers (0..1), default neutral 0.6-0.7-ish
  const stroller = clamp(cityMod.stroller ?? 0.65, 0, 1);
  const hygiene = clamp(cityMod.hygiene ?? 0.70, 0, 1);
  const accessibility = clamp(cityMod.accessibility ?? 0.75, 0, 1);
  const lowStim = clamp(cityMod.lowStim ?? 0.60, 0, 1);

  // --- Feature heuristics
  const hasCribHint = types.some((t) => t.includes("lodging") || t.includes("hotel"));
  const pricePenalty = clamp((price - 2) / 3, 0, 1); // higher price reduces score slightly

  // Normalize review signal to 0..1
  const ratingSignal = clamp((rating - 3) / 2, 0, 1); // 3→0, 5→1
  const volumeSignal = clamp(Math.log10(1 + volume) / 4, 0, 1); // >1k tends toward 1

  // Base safety/comfort pillars (weighted)
  const safetyScore = 0.5 * hygiene + 0.5 * accessibility;           // 0..1
  const comfortScore = 0.5 * stroller + 0.5 * lowStim;                // 0..1

  // Hotel contribution
  const hotelSignal = 0.7 * ratingSignal + 0.3 * volumeSignal - 0.15 * pricePenalty;
  const hotelScore = clamp(hotelSignal, 0, 1);

  // Direct flight preference bumps lowStim slightly (less travel stress)
  const travelMod = directOnly ? 0.05 : 0;

  // Roll-up (weights tuned for “infant-friendly”)
  const total01 = clamp(
    0.40 * safetyScore +
      0.25 * comfortScore +
      0.30 * hotelScore +
      0.05 * travelMod +
      (hasCribHint ? 0.03 : 0),
    0,
    1
  );

  // Pace & naps
  const napBlocks = ageBand === "0-6m" ? 3 : ageBand === "7-12m" ? 2 : 1;
  const pace: BCS["pace"] = ageBand === "0-6m" ? "Slow" : ageBand === "7-12m" ? "Moderate" : "Fast";

  return {
    total: Math.round(total01 * 100),
    pace,
    napBlocks,
    breakdown: [
      { label: "Healthcare/Hygiene", score: Math.round(hygiene * 100) },
      { label: "Accessibility", score: Math.round(accessibility * 100) },
      { label: "Stroller/Low-stim", score: Math.round(comfortScore * 100) },
      { label: "Hotel reviews", score: Math.round(hotelScore * 100) },
    ],
  };
}