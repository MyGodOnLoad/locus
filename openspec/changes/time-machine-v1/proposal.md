## Why

The current picture app organizes photos as files — a folder-based viewer with map and timeline overlays. This treats photos as assets to manage, not memories to relive. The product pivot redefines the app as a "time machine" that surfaces how a person moved through the world, using GPS-tagged photos as evidence of that movement. This unlocks emotional value (re-experiencing life chapters) that a file manager never will.

## What Changes

- **BREAKING**: Replace `CombinedView` / `MapView` as the default entry point with a new **Life Trajectory Map** (`LifemapView`) that shows residence periods as heatmaps, trip trajectories as polylines, and photo clusters as scatter markers, all driven by a draggable time cursor
- **BREAKING**: Demote `TimelineView` to a secondary "All Photos" view accessible as a fallback, not the primary navigation
- Add **residence period detection** (DBSCAN spatial clustering + 60-day temporal filtering) as a computed layer on the existing photo store
- Add **trip detection** (excursions outside residence zones, 4h+ gap filtering) as a computed sub-layer of residences
- Add **trip list and trip detail views** with per-day photo streams and trajectory maps
- Add **manual correction UI** for merging, splitting, naming, and ignoring detected residences and trips
- Persist user corrections to `.locus-metadata.json`; never modify original photo files
- Add **batch reverse geocoding** with localStorage caching for place-name labeling on maps and trip cards

## Capabilities

### New Capabilities

- `residence-detection`: DBSCAN spatial clustering engine that identifies residence periods (60-day threshold) from GPS-tagged photos, with excursion detection and migration gaps
- `trip-detection`: Excursion analysis within residence periods — identifies continuous travel segments with configurable gap merging and minimum photo thresholds
- `lifemap-view`: Default map view showing residence heatmaps, trip trajectory polylines, photo scatter markers, and a draggable time cursor; replaces current CombinedView/MapView as entry point
- `trip-list`: Card-based trip browser sorted by recency, each card showing cover photo, date range, and place summary
- `trip-detail`: Per-trip view with trajectory map, day-grouped photo stream, and place annotations
- `reverse-geocoding`: Batch reverse geocoding service with localStorage cache, providing place names for map labels and trip summaries
- `residence-trip-correction`: Manual merge, split, rename, promote-to-residence, demote-to-trip, and ignore-noise operations on detected periods, persisted to `.locus-metadata.json`

### Modified Capabilities

None — all existing capabilities remain. The old `CombinedView`, `MapView`, and `TimelineView` are superseded by new views but preserved as fallback/reference.

## Impact

- **New services**: `residenceDetector.js`, `tripDetector.js`, `reverseGeocoder.js` (script regression tests expected for each)
- **New views**: `LifemapView.jsx`, `TripListView.jsx`, `TripDetailView.jsx`
- **New components**: `TripCard.jsx`, `TimeCursor.jsx`, `LayerControl.jsx`
- **Modified**: `photoStore.js` (add `residencePeriods`, `trips` computed properties), `MapComponent.jsx` (add heatmap + trajectory layers), `exifParser.js` (restore orientation/aperture/shutter/ISO fields)
- **New data contract**: `.locus-metadata.json` schema for user corrections
- **Dependencies**: No new npm packages required (DBSCAN implemented in pure JS, Leaflet heatmap plugin may be needed for heatmap layer)
