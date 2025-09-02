export type Pillars = {
  healthcare: number; hygiene: number; accessibility: number;
  stimulation: number; transit: number; climate: number;
};
export type AgeGroup = "0-3m"|"4-6m"|"7-12m"|"1-3y"|"3-5y";
const WEIGHTS: Record<AgeGroup, Record<keyof Pillars, number>> = {
  "0-3m":  { healthcare:.25, hygiene:.20, accessibility:.15, stimulation:.20, transit:.15, climate:.05 },
  "4-6m":  { healthcare:.22, hygiene:.20, accessibility:.18, stimulation:.18, transit:.16, climate:.06 },
  "7-12m": { healthcare:.20, hygiene:.20, accessibility:.20, stimulation:.16, transit:.16, climate:.08 },
  "1-3y":  { healthcare:.18, hygiene:.18, accessibility:.22, stimulation:.16, transit:.16, climate:.10 },
  "3-5y":  { healthcare:.16, hygiene:.16, accessibility:.22, stimulation:.16, transit:.16, climate:.14 },
};
export function computeBCS(p: Pillars, age: AgeGroup) {
  const w = WEIGHTS[age];
  const stim = 100 - p.stimulation;
  const transit = 100 - p.transit;
  const score =
    p.healthcare*w.healthcare + p.hygiene*w.hygiene + p.accessibility*w.accessibility +
    stim*w.stimulation + transit*w.transit + p.climate*w.climate;
  const tag = score >= 80 ? "Baby-Safe" : score >= 60 ? "Moderate" : "Relaxed only";
  return { score: Math.round(score), tag, rationale: [
    `Healthcare ${p.healthcare}/100`, `Hygiene ${p.hygiene}/100`, `Accessibility ${p.accessibility}/100`,
    `Low-stimulation ${(100 - p.stimulation)}/100`, `Low transit stress ${(100 - p.transit)}/100`, `Climate ${p.climate}/100`
  ]};
}
export function defaultPace(age: AgeGroup): "Relaxed"|"Moderate"|"Active" {
  if (age==="0-3m"||age==="4-6m") return "Relaxed";
  if (age==="7-12m"||age==="1-3y") return "Moderate";
  return "Active";
}
export function recommendedNapBlocks(age: AgeGroup): number {
  if (age==="0-3m"||age==="4-6m"||age==="7-12m") return 2;
  if (age==="1-3y") return 1;
  return 0;
}
