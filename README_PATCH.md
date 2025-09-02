# BabyGo1 Consolidated Patch

## Steps to Apply

1. Extract into your repo root (same level as `app/`, `components/`, `data/`).
   ```bash
   unzip -o BabyGo1_ConsolidatedPatch.zip
   ```

2. Remove the duplicate sub-app to avoid conflicts:
   ```bash
   rm -rf BabyGov1
   ```

3. Install dependencies and start dev server from repo root:
   ```bash
   npm install
   rm -rf .next
   npm run dev
   ```

This consolidates the project into a single Next.js app at the root with fixed imports (`@/data/*`, `@/components/*`).
