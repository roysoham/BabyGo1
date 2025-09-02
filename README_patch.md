# BabyGo1 Hotels API Patch

Adds `/api/hotels` (Google Places Nearby Search) and wires the Hotels tab to live data when `lat,lng` are available.

## Env
Ensure `.env.local` contains:
- `GOOGLE_MAPS_API_KEY=...`  (or `GOOGLE_PLACES_KEY=...`)

## Apply
```bash
cd BabyGo1
unzip -o BabyGo1_Hotels_API_Patch.zip
rm -rf .next
npm run dev
```

## Usage
- On home page select destination from autocomplete (sets `toId`).
- /results resolves `lat,lng` from `toId` and calls `/api/hotels?lat=..&lng=..`.
- Falls back to local `data/hotels.json` when API returns nothing.
