"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Suggestion = { place_id: string; description: string };
const ageGroups = ["0-3m","4-6m","7-12m","1-3y","3-5y"] as const;
type AgeGroup = typeof ageGroups[number];

export default function SearchForm() {
  // ...content omitted for brevity, same as before
}
