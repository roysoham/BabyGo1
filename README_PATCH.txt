BabyGo Patch — Hotels Tab (Standalone Search)
=============================================

What this adds
--------------
A self-contained Hotels tab that DOES NOT depend on the Results URL
for coordinates. It has its own location autocomplete + filters and
calls your existing APIs:

- /api/places/autocomplete?q=...
- /api/places/details?placeId=...
- /api/hotels?lat=...&lng=...&radius=...&limit=...&minRating=...&maxPriceLevel=...&keyword=...&cribsLikely=...

Files in this patch
-------------------
components/HotelsTab.tsx
components/HotelsCards.tsx
components/ui/Chip.tsx
scripts/smoke_tests.sh

How to install
--------------
1) From your repo root, unzip:
   unzip babygo_hotels_tab_patch_0312.zip -o

   (If you use Windows PowerShell: Expand-Archive -Path babygo_hotels_tab_patch_0312.zip -DestinationPath . -Force)

2) Import and render the tab in your Results view where you render the Hotels tab content.
   Example (inside your ResultsView or results page when Hotels tab is active):

   import HotelsTab from "@/components/HotelsTab";

   // inside Hotels tab panel:
   <HotelsTab />

3) Restart dev server:
   rm -rf .next && npm run dev

4) Run smoke tests (optional, from repo root):
   bash scripts/smoke_tests.sh

Notes
-----
- Keyword biases Places "keyword" field (not review text). "Cribs likely" appends kid-friendly hints server-side via the querystring (keyword bias), AND we still filter client-side by minRating and maxPriceLevel.
- Results are sorted client-side by rating desc then price_level asc.
- If you see zero results, try lowering min rating to 4.0 or increasing radius to 6000–10000.

Support
-------
If your components path alias isn't "@", change imports accordingly.
