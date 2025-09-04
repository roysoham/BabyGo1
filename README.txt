BabyGo1 Results Fix (0311c)
---------------------------

Files included:
- components/ResultsView.tsx
- components/ResultsHeader.tsx
- app/(site)/results/page.tsx

How to apply:
1) Copy the zip to your repo root (same folder where `app/` and `components/` live).
2) unzip -o BabyGo1_ResultsFix_0311c.zip -d .
3) npm run dev

Notes:
- ResultsView resolves `computeBCS` defensively so either named or default exports work.
- If no Google Place ID is supplied, it approximates coords for popular cities.
- Hotels try the /api/hotels endpoint first; if empty, it falls back to local hotels.json.
- Header includes "Open in Google Maps" link when coords are available.
