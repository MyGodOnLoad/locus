## Context

The current app (`picture`) is a photo folder viewer with a Leaflet map overlay and a timeline. The product pivot to "时光机" (Time Machine) transforms it into a life-trajectory explorer where the primary organizing principle is "the person's movement on Earth," with photos as supporting evidence. This is a rewrite of the navigation model and the addition of computational detection engines, while preserving the EXIF parsing and rendering infrastructure already in place.

The existing stack: React 18 + Vite, Zustand state, Leaflet maps (`react-leaflet`), `exifr` for EXIF parsing. JavaScript (not TypeScript), 2-space indents, single quotes, `var` not `let`/`const`. Single CSS file.

## Goals / Non-Goals

**Goals:**
- Implement DBSCAN-based residence period detection as a pure computed layer on `photos[]`
- Implement trip detection within residence periods using excursion-gap analysis
- Build a new default LifemapView with heatmap, trajectory, scatter, and time-cursor layers
- Build trip list (cards) and trip detail (trajectory map + day-grouped photo stream) views
- Add manual correction UI for merge, split, rename, promote/demote, ignore
- Add batch reverse geocoding with localStorage cache
- Persist user corrections to `.locus-metadata.json` without touching originals

**Non-Goals (this change — P0 only):**
- Trip replay animation (P1)
- Story engine (P2)
- GPX/HTML export (P2)
- Video support, slideshow, mobile responsive, keyboard shortcuts (P3)
- Multi-folder aggregation, duplicate detection, search/filter enhancements

## Decisions

### 1. Residence and trip detection: pure computed properties on the photo store

**Choice:** Compute `residencePeriods` and `trips` as Zustand getters/derived state, recomputed whenever `photos[]` changes. Do not store them in `.locus-metadata.json`.

**Rationale:** These are deterministic functions of the photo set ± user corrections. Persisting them would create sync problems when photos are added or removed. Only user corrections (merge, split, rename) are persisted.

**Alternative considered:** Precompute and cache to JSON → rejected because it would require cache invalidation logic on every photo load.

### 2. DBSCAN implementation: hand-rolled pure JS

**Choice:** Implement DBSCAN directly (~50 lines) rather than adding an npm dependency.

**Rationale:** The algorithm is compact, we need a specific variant (Haversine distance, 0.5km eps), and there are no mature, maintained DBSCAN packages on npm that support geographic distance out of the box.

### 3. Heatmap layer: Leaflet.heat

**Choice:** Add `leaflet.heat` as a dependency for the residence heatmap layer.

**Rationale:** The Leaflet heatmap plugin is small (~10KB), well-maintained, and integrates directly with react-leaflet's `useMap` hook. Rolling our own WebGL heatmap would be disproportionate effort.

**Alternative considered:** Canvas-based custom heatmap → rejected due to the integration complexity with Leaflet's coordinate system.

### 4. Reverse geocoding: batch with localStorage cache

**Choice:** Send batches of lat/lng pairs to the Amap (高德) reverse geocoding API, cache results in localStorage keyed by rounded `lat,lng` (4 decimal places ≈ 11m resolution).

**Rationale:** Pre-computing all place names on load avoids per-marker API calls. localStorage persists across sessions, dramatically reducing API usage for repeat photo sets.

### 5. Metadata persistence: `.locus-metadata.json`

**Choice:** Write all user corrections (residence names, merges, splits, ignored items, hearted photos) to a single JSON file in the photo directory root. Read it during photo loading and merge into computed state.

**Rationale:** Portable (moves with the photo folder), human-readable (JSON), and doesn't touch original files. One file is simpler to manage than per-photo sidecars.

**Schema:**
```json
{
  "version": 1,
  "residenceOverrides": {
    "<residenceId>": { "name": "...", "mergedFrom": [...], "ignored": false }
  },
  "tripOverrides": {
    "<tripId>": { "name": "...", "mergedFrom": [...], "promotedToResidence": false, "ignored": false }
  },
  "heartedPhotos": ["photoId1", "photoId2"]
}
```

### 6. View routing: flat switching, not nested

**Choice:** Keep the existing flat view-routing pattern in `App.jsx` — a single active view at a time, switched via store. Views: `lifemap` (default), `trip-list`, `trip-detail`, `all-photos`.

**Rationale:** Matches the existing architecture. Nested routing (react-router) would be overkill for a single-page photo app with no URL persistence requirements.

## Risks / Trade-offs

- **DBSCAN performance on large sets:** O(n²) worst case with naive DBSCAN. With 10K photos, ~100M distance calculations → roughly 2-5 seconds on modern hardware. → Mitigation: use a spatial index (grid bucketing) if photos exceed 5K; initially accept the naive scan and benchmark.
- **Reverse geocoding API rate limits:** Amap free tier limits may throttle batch requests. → Mitigation: localStorage cache means most coordinates are only queried once; implement 200ms inter-request delay.
- **Heatmap rendering on zoom:** Many markers at low zoom levels may slow Leaflet. → Mitigation: only render heatmap at zoom levels ≥ 6; below that, show cluster markers only.
- **Correction data loss:** If `.locus-metadata.json` gets corrupted, user edits are lost. → Mitigation: auto-backup on write (write to `.locus-metadata.json.tmp`, then rename); but accept this as a P1 concern.
- **Breaking existing views:** Removing CombinedView as default may surprise existing users. → Mitigation: keep old views accessible via the "All Photos" fallback; add a migration notice on first launch after update.
