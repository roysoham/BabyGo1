export type BCSInput = {
  age: string;
  country?: string;
  directOnly: boolean;
  climate?: string;
  healthcare?: number;
  hygiene?: number;
  accessibility?: number;
  lowStim?: number;
};

export type BCSScore = {
  total: number;
  breakdown: { label: string; score: number }[];
  pace: "Relaxed"|"Moderate"|"Active";
  napBlocks: number;
};

export function defaultPace(age: string): "Relaxed"|"Moderate"|"Active"{
  if (age==="0-3m") return "Relaxed";
  if (age==="4-6m") return "Relaxed";
  if (age==="7-12m") return "Moderate";
  if (age==="1-3y") return "Moderate";
  return "Active";
}

export function recommendedNapBlocks(age: string): number{
  if (age==="0-3m") return 3;
  if (age==="4-6m") return 2;
  if (age==="7-12m") return 2;
  if (age==="1-3y") return 1;
  return 1;
}

export function computeBCS(input: BCSInput){
  const weights = { healthcare: 0.3, hygiene: 0.3, accessibility: 0.2, lowStim: 0.2 };
  const h = input.healthcare ?? 70;
  const hy = input.hygiene ?? 70;
  const a = input.accessibility ?? (input.directOnly ? 80 : 65);
  const l = input.lowStim ?? 60;
  const total = Math.round(h*weights.healthcare + hy*weights.hygiene + a*weights.accessibility + l*weights.lowStim);
  const pace = defaultPace(input.age);
  const napBlocks = recommendedNapBlocks(input.age);
  return {
    total,
    breakdown: [
      { label: "Healthcare", score: h },
      { label: "Hygiene", score: hy },
      { label: "Accessibility", score: a },
      { label: "Low-stimulation", score: l },
    ],
    pace,
    napBlocks
  };
}
