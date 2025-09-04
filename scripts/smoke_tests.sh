#!/usr/bin/env bash
set -euo pipefail

echo "S1) Autocomplete → at least 1 suggestion for Paris"
curl -s "http://localhost:3000/api/places/autocomplete?q=Paris" | jq '.[0] // empty' | tee /dev/stderr >/dev/null

PID=$(curl -s "http://localhost:3000/api/places/autocomplete?q=Paris" | jq -r '.[0].place_id // empty')
if [ -z "${PID}" ]; then
  echo "Autocomplete failed (no place_id)."
  exit 1
fi
echo "PID=${PID}"

echo "S2) Details → lat/lng"
curl -s "http://localhost:3000/api/places/details?placeId=${PID}" | jq '.result.geometry.location'

LOC=$(curl -s "http://localhost:3000/api/places/details?placeId=${PID}" | jq -r '.result.geometry.location | "\(.lat),\(.lng)"')
LAT=$(echo "$LOC" | cut -d, -f1)
LNG=$(echo "$LOC" | cut -d, -f2)

echo "S3) Hotels → count"
curl -s "http://localhost:3000/api/hotels?lat=${LAT}&lng=${LNG}&radius=3500&limit=12&minRating=4.5&maxPriceLevel=3&keyword=kids&cribsLikely=true" | jq '.items | length'
