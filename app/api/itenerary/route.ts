import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") || "Unknown";
  const days = parseInt(searchParams.get("days") || "3");

  const itinerary = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    activities: [`Explore ${city} - Activity ${i + 1}`]
  }));

  return NextResponse.json({ days: itinerary });
}