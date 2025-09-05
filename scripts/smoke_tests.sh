#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:3000"

echo "S1) Autocomplete -> 1+ suggestion"
curl -s "$BASE/api/places/autocomplete?q=Paris" | jq '.[:2]' || echo "autocomplete failed"

PID=$(curl -s "$BASE/api/places/autocomplete?q=Paris" | jq -r '.[0].place_id // ""')
echo "PID=${PID}"

echo
echo "S2) Itinerary (Paris, 7d) -> day count"
curl -s "$BASE/api/itinerary?city=Paris&days=7" | jq '.days // "no days field"' || echo "itinerary failed"

echo
echo "S3) Hotels (Paris coords) -> count"
curl -s "$BASE/api/hotels?lat=48.8566&lng=2.3522&radius=3500&limit=12" | jq '.items | length' || echo "hotels API not wired yet"

echo
echo "S4) BCS compute smoke (dummy hotel)"
npx tsx scripts/bcs_probe.ts | jq '.total'

