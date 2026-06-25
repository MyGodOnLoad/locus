## 1. Detection Engines

- [x] 1.1 Implement `residenceDetector.js` with DBSCAN spatial clustering (Haversine distance), 60-day temporal filtering, excursion detection, and migration gap detection
- [x] 1.2 Implement `tripDetector.js` with excursion analysis, 48h gap merging, trajectory computation, cover photo selection, and trip attribute generation
- [x] 1.3 Write regression test scripts: `scripts/residenceDetector.regression.mjs` and `scripts/tripDetector.regression.mjs` against known photo sets

## 2. Reverse Geocoding

- [x] 2.1 Implement `reverseGeocoder.js` with batch Amap API calls, localStorage cache (keyed by rounded `lat,lng`), 200ms inter-request delay, and fallback-to-coordinates error handling
- [x] 2.2 Write `scripts/reverseGeocoder.regression.mjs`
- [x] 2.3 Add Amap API key configuration support

## 3. Store & Metadata Persistence

- [x] 3.1 Add `residencePeriods` and `trips` computed properties to `photoStore.js`, derived from detection engines with correction overlay
- [x] 3.2 Define `.locus-metadata.json` schema with residence overrides, trip overrides, and hearted photos
- [x] 3.3 Implement `readMetadata()` and `writeMetadata()` functions for `.locus-metadata.json` read/write with atomic rename
- [x] 3.4 Wire metadata persistence into photo loading pipeline (read on load, write on correction)

## 4. LifemapView

- [x] 4.1 Create `LifemapView.jsx` with Leaflet map as the new default view
- [x] 4.2 Add residence heatmap layer using `leaflet.heat` plugin
- [x] 4.3 Add trip trajectory polyline layer with distinct colors and place-name labels
- [x] 4.4 Add photo scatter marker layer with clustering
- [x] 4.5 Implement `TimeCursor.jsx` draggable time-range widget at bottom of view
- [x] 4.6 Implement `LayerControl.jsx` toggle controls for heatmap/trajectories/scatter visibility
- [x] 4.7 Add map tile switcher (Amap / CartoDB / OSM)

## 5. Trip List & Detail Views

- [x] 5.1 Create `TripCard.jsx` component with cover thumbnail, date range, duration, place summary, and photo count
- [x] 5.2 Create `TripListView.jsx` with sorted card list and empty state
- [x] 5.3 Create `TripDetailView.jsx` with header, focused trajectory map, day-grouped photo stream, and day location summaries
- [x] 5.4 Wire trip list ↔ trip detail navigation
- [x] 5.5 Integrate existing `PhotoLightbox` into trip detail (constrained to trip photos)

## 6. Residence & Trip Correction UI

- [x] 6.1 Implement rename operation (inline edit on period/trip name)
- [x] 6.2 Implement merge operation (select two adjacent periods → combine)
- [x] 6.3 Implement split operation (select period + split date → divide)
- [x] 6.4 Implement promote-to-residence and demote-to-trip operations
- [x] 6.5 Implement ignore/noise operation (hide from all views)
- [x] 6.6 Add context menu on LifemapView for map-element corrections
- [x] 6.7 Add inline correction buttons to TripDetailView

## 7. Navigation & View Restructuring

- [x] 7.1 Restructure `App.jsx` view routing: `lifemap` (default), `trip-list`, `trip-detail`, `all-photos`
- [x] 7.2 Demote `TimelineView` / `MapView` / `CombinedView` to fallback under "All Photos"
- [x] 7.3 Add navigation bar or tab-like control for switching between Lifemap, Trip List, and All Photos
- [x] 7.4 Restore dropped EXIF fields (aperture, shutter, ISO, orientation) in `exifParser.js`

## 8. Integration & Polish

- [x] 8.1 End-to-end dev smoke test: open folder with geotagged photos, verify residence detection, trip detection, map rendering, and corrections persistence
- [x] 8.2 Verify `.locus-metadata.json` is created/updated correctly and does not modify original photo files
- [x] 8.3 CSS styling for all new components and views (consistent with existing visual style)
- [x] 8.4 Update `README.md` or project docs to reflect the new product direction
