#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:3000"

echo "S1) Autocomplete -> 1+ suggestion"
curl -s "$BASE/api/places/autocomplete?q=Paris" | jq '.items[0,1]'
PID=$(curl -s "$BASE/api/places/autocomplete?q=Paris" | jq -r '.items[0].place_id'); echo "PID=$PID"

echo "S2) Details -> lat/lng"
curl -s "$BASE/api/places/details?placeId=$PID" | jq '.result.geometry.location'

echo "S3) Hotels(Paris) -> count"
curl -s "$BASE/api/hotels?lat=48.8566&lng=2.3522&radius=3500&limit=12" | jq '.items | length'

echo
echo "S4) Itinerary (7d, Paris) -> day count"
curl -s "$BASE/api/itinerary?city=Paris&days=7&childAge=7-12m" | jq '.days | length'

echo
echo "S5) Activities (Paris) -> >=5"
curl -s "$BASE/api/activities?city=Paris&limit=8" | jq '.items | length'

echo
echo "S6) Activities (Tokyo) -> >=5"
curl -s "$BASE/api/activities?city=Tokyo&limit=8" | jq '.items | length'

echo
echo "S7) Hotels seed fallback (London) -> ensure shape"
curl -s "$BASE/api/hotels?city=London&limit=3" | jq '.items[0] | {name, rating, price_level, lat, lng}'
