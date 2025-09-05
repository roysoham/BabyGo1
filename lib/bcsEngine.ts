// lib/bcsEngine.ts
// Baby Comfort Score from live hotel features + light city modifiers.

export type BCSInputs = {
  hotel: {
    rating?: number;               // 1..5 (Google)
    user_ratings_total?: number;   // volume proxy
    price_level?: number;          // 0..4 (Google)  -- missing = undefined
    types?: string[];              // ["lodging","hotel",...]
    name?: string;
  };
  cityMod?: {
    transit_ease?: number;     // 0..100
    stroller?: number;         // 0..100
    heat_risk?: number;        // 0..100 (higher=worse)
    noise?: number;            // 0..100 (higher=worse)
  };
  ageBand: "0-3m" | "4-6m" | "7-12m" | "1-3y";
  directOnly: boolean;
};

export type BCS = {
  total: number;                  // 0..100
  pace: "Easy"|"Moderate"|"Active";
  napBlocks: number;              // 1..3
  breakdown: { label: string; score: number }[];
};

const clamp = (n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));

export function computeBCS(input: BCSInputs): BCS {
  const { hotel, cityMod={}, ageBand, directOnly } = input;
  const rating  = hotel.rating ?? 4.0;
  const volume  = hotel.user_ratings_total ?? 50;
  const price   = hotel.price_level; // 0..4 (undefined allowed)
  const types   = (hotel.types ?? []).map(t=>t.toLowerCase());
  const name    = (hotel.name ?? "").toLowerCase();

  // --- Age → nap blocks
  const napBlocks = ageBand==="0-3m" ? 3 : ageBand==="4-6m" ? 3 : ageBand==="7-12m" ? 2 : 1;

  // --- Hygiene (50% hotel, 50% city)
  // hotel hygiene proxy: rating + volume quality
  const volBoost = volume >= 1000 ? 10 : volume >= 200 ? 6 : volume >= 50 ? 3 : 0;
  let hygieneHotel = clamp((rating - 3.5) * 20 + 70 + volBoost, 40, 100); // 4.0→80, 4.5→90, etc.

  // city hygiene proxy: stroller & transit uplift; heat/noise reduce
  const cm = {
    transit_ease: cityMod.transit_ease ?? 70,
    stroller:     cityMod.stroller ?? 70,
    heat_risk:    cityMod.heat_risk ?? 30, // lower is better
    noise:        cityMod.noise ?? 40      // lower is better
  };
  const hygieneCity = clamp(
    60 + (cm.stroller-50)*0.3 + (cm.transit_ease-50)*0.2 - (cm.heat_risk-30)*0.25 - (cm.noise-40)*0.15,
    30, 95
  );
  const hygiene = Math.round(hygieneHotel*0.55 + hygieneCity*0.45);

  // --- Accessibility
  // price_level can correlate with elevator / lobby / room size; “hostel” penalised
  let accessHotel = 70;
  if (price !== undefined) accessHotel += (price*5); // 0..20 boost
  if (types.includes("hostel") || name.includes("hostel")) accessHotel -= 15;
  if (types.includes("apartment")) accessHotel -= 5; // elevators less guaranteed

  const accessCity = clamp(65 + (cm.transit_ease-50)*0.5 + (cm.stroller-50)*0.5, 40, 95);
  const accessibility = Math.round(clamp(accessHotel,40,90)*0.6 + accessCity*0.4);

  // --- Low stimulation (quiet)
  // Use price level (higher tends to quieter), avoid “party” words
  const partyWords = ["party","club","hostel","bar"];
  const namePenalty = partyWords.some(w=>name.includes(w)) ? 15 : 0;
  let quietHotel = 65 + (price!==undefined ? price*6 : 0) - namePenalty; // price 0..4 → 0..24
  if (types.includes("resort")) quietHotel -= 5; // activity-heavy

  const quietCity = clamp(70 - (cm.noise-40)*0.6 - (cm.heat_risk-30)*0.2, 35, 90);
  const lowStim = Math.round(clamp(quietHotel,35,90)*0.55 + quietCity*0.45);

  // --- Flight adjustment
  const travelAdj = directOnly ? 0 : -6;

  // Weighted total
  const totalRaw = hygiene*0.4 + accessibility*0.3 + lowStim*0.3 + travelAdj;
  const total = clamp(Math.round(totalRaw), 20, 99);

  const pace: BCS["pace"] = napBlocks>=3 ? "Easy" : napBlocks===2 ? "Moderate" : "Active";
  return {
    total,
    pace,
    napBlocks,
    breakdown: [
      { label: "Hygiene",      score: hygiene },
      { label: "Accessibility",score: accessibility },
      { label: "Low-stimulation", score: lowStim }
    ]
  };
}