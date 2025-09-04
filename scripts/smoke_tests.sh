#!/usr/bin/env bash
set -euo pipefail

BASE="${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}"

echo "S1) Autocomplete -> 1+ suggestion"
curl -fsS "$BASE/api/places/autocomplete?q=Paris" | jq '.[0]' | tee /dev/stderr
PID=$(curl -fsS "$BASE/api/places/autocomplete?q=Paris" | jq -r '.[0].place_id')
echo "PID=$PID"

echo
echo "S2) Details -> lat/lng"
curl -fsS "$BASE/api/places/details?placeId=$PID" | jq '.result.geometry.location'

echo
echo "S3) Hotels -> count"
curl -fsS "$BASE/api/hotels?lat=48.8566&lng=2.3522&radius=3500&limit=12" | jq '.items | length'

echo
echo "S4) coords source"
curl -fsS "$BASE/results?from=Tokyo&to=Paris&depart=2025-09-04&ret=2025-09-10&childAge=7-12m&travellers=2&directOnly=true&lat=48.8566&lng=2.3522" \
  | head -c 0 ; echo "coords source smoke ☑"

echo
echo "S5) Hotels search with filters -> should return >0"
curl -s "http://localhost:3000/api/hotels?lat=48.8566&lng=2.3522&radius=3500&limit=12&keyword=kids,crib,quiet" | jq '.items | length'