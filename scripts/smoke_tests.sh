#!/usr/bin/env bash
set -euo pipefail

base="http://localhost:3000"

echo "S1) Autocomplete -> 1 suggestion"
resp=$(curl -s "${base}/api/places/autocomplete?q=Paris")
echo "$resp" | head -c 120 && echo
pid=$(echo "$resp" | jq -r '.[0].place_id // empty')
echo "PID=${pid}"

echo
echo "S2) Details -> lat/lng"
if [ -n "$pid" ]; then
  curl -s "${base}/api/places/details?placeId=${pid}" | jq -r '.result.geometry.location'
else
  echo "details: skipped (no pid)"
fi

echo
echo "S3) Hotels -> count"
# Paris lat/lng
curl -s "${base}/api/hotels?lat=48.8566&lng=2.3522&radius=3500&limit=12" | jq '.items | length'

echo
echo "S4) coords source"
curl "http://localhost:3000/results?from=Tokyo&to=Paris&lat=48.8566&lng=2.3522" | grep -o "no results\|coords source"

echo 
"S5) Hotels search with filters -> should return >0"
curl -s "http://localhost:3000/api/hotels?lat=48.8566&lng=2.3522&radius=3500&limit=12&keyword=kids,crib,quiet" | jq '.items | length'