// lib/bcsEngine.ts
/**
 * Baby Comfort Score (BCS) helpers
 * Stable named exports: computeBCS, defaultPace, recommendedNapBlocks
 */

export type BCSInput = {
  age: string;           // "0-3m" | "4-6m" | "7-12m" | "1-3y" | "3-5y"
  directOnly?: boolean;  // flight preference
  country?: string;      // optional, nudges safety/healthcare weights
};

export type BCSBreakdownItem = { label: string; score: number };

export type BCSResult = {
  total: number;               // 0..100
  pace: "Relaxed" | "Moderate" | "Active";
  napBlocks: number;           // per day
  breakdown: BCSBreakdownItem[];
};

// simple age → defaults
const AGE_PRESETS: Record<string, { pace: BCSResult["pace"]; nap: number }> = {
  "0-3m":  { pace: "Relaxed", nap: 3 },
  "4-6m":  { pace: "Relaxed", nap: 3 },
  "7-12m": { pace: "Moderate", nap: 2 },
  "1-3y":  { pace: "Moderate", nap: 1 },
  "3-5y":  { pace: "Active",   nap: 0 },
};

export function defaultPace(age: string): BCSResult["pace"] {
  return (AGE_PRESETS[age]?.pace ?? "Moderate");
}

export function recommendedNapBlocks(age: string): number {
  return (AGE_PRESETS[age]?.nap ?? 1);
}

/**
 * Very lightweight, deterministic scoring (no network).
 * You can feed live country/safety/healthcare indices later.
 */
export function computeBCS(input: BCSInput): BCSResult {
  const age = input.age || "7-12m";
  const pace = defaultPace(age);
  const napBlocks = recommendedNapBlocks(age);

  // Base pillar seeds (roll in real data later)
  let healthcare = 70;
  let hygiene = 70;
  let accessibility = 70;
  let lowStim = pace === "Relaxed" ? 75 : pace === "Moderate" ? 65 : 55;
  let transit = input.directOnly ? 75 : 60;

  // Small nudges by country if provided (placeholder logic)
  if ((input.country || "").toLowerCase() === "japan") {
    hygiene += 10;
    transit += 5;
  }
  if ((input.country || "").toLowerCase() === "italy") {
    accessibility -= 5;
  }

  // Clamp 0..100
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  const breakdown: BCSBreakdownItem[] = [
    { label: "Healthcare",        score: clamp(healthcare) },
    { label: "Hygiene",           score: clamp(hygiene) },
    { label: "Accessibility",     score: clamp(accessibility) },
    { label: "Low-stimulation",   score: clamp(lowStim) },
    { label: "Low transit stress",score: clamp(transit) },
    { label: "Climate",           score: 70 }, // placeholder
  ];

  const total =
    Math.round(
      breakdown.reduce((s, b) => s + b.score, 0) / breakdown.length
    );

  return { total, pace, napBlocks, breakdown };
}