# Photo Album — Local Photo Browser with Map & Timeline

**Date:** 2026-06-22
**Status:** approved

## Overview

A single-page web application that lets users browse local photos through three viewing modes: Map, Timeline, and a combined Map+Timeline split view. No backend — all processing happens in the browser.

## Technology Stack

- **Framework:** React 18 (component isolation for three view modes, shared state)
- **Build:** Vite (fast HMR, simple config)
- **Map:** Leaflet + OpenStreetMap tiles (free, lightweight, no API key)
- **EXIF:** exifr (parses GPS coordinates, DateTimeOriginal, camera model from raw ArrayBuffer)
- **State:** Zustand (lightweight shared store across views)
- **Thumbnails:** Browser Canvas API (generate on read, no server needed)

## Core Modules

| Module | Responsibility |
|--------|---------------|
| PhotoLoader | `showDirectoryPicker()` → recursive directory scan → ArrayBuffer for each image |
| ExifParser | Parse ArrayBuffer via exifr → `{lat, lng, datetime, camera, ...}` |
| PhotoStore | Zustand store: photo list, current view mode, filters, selection state |
| MapView | Leaflet map with marker clustering, popup thumbnails |
| TimelineView | Vertical timeline grouped by year/month, card-style thumbnail waterfall |
| CombinedView | 60/40 split: map above, timeline below, bi-directional linkage |
| PhotoLightbox | Fullscreen image viewer, prev/next nav, EXIF metadata panel |

## Three View Modes

### 1. Map View (standalone)
- Fullscreen Leaflet map
- Photos with GPS coordinates are plotted as markers
- Nearby markers auto-cluster (supercluster or Leaflet.markercluster)
- Click cluster to zoom in; click marker to show thumbnail popup
- Click thumbnail → open in Lightbox
- Non-geotagged photos are excluded with a small info banner: "N photos only visible in timeline"

### 2. Timeline View (standalone)
- Fullscreen vertical timeline, newest first
- Grouped by year → month
- Each photo shown as a card with thumbnail, date, and camera model
- Year jump bar on the right side for fast navigation
- Photos without DateTimeOriginal fall back to file `lastModifiedDate`, marked with a warning icon
- Click card → open in Lightbox

### 3. Combined View
- Top 60%: interactive map
- Bottom 40%: scrollable timeline
- Bi-directional linkage:
  - **Map → Timeline:** drag-select or pan the map → timeline filters to photos within the visible bounds
  - **Timeline → Map:** click a month/year group → map fits bounds to those photos' locations
- Same clustering and card styles as standalone modes
- Seamless mode switching: clicking a standalone-mode button transitions from combined to that mode with current data intact

## Data Flow

```
User selects folder (showDirectoryPicker)
  → PhotoLoader enumerates image files recursively
  → For each file:
      → read ArrayBuffer
      → exifr.parse(buffer) → {lat, lng, datetime, make, model}
      → Canvas thumbnail generation (200px max dimension, JPEG 0.7 quality)
      → Store in PhotoStore
  → All three views subscribe to PhotoStore
  → Filter/selection state synchronized through store
```

## Edge Cases

- **No GPS:** Exclude from map; show normally in timeline
- **No DateTimeOriginal:** Use `file.lastModified` with warning badge "Time may be inaccurate"
- **Non-image files:** Filter to JPEG, PNG, HEIC, WebP only
- **Large collections (1000+ photos):** Thumbnails generated on demand, marker clustering prevents map performance issues
- **Browser support:** Requires Chrome/Edge (File System Access API). Show graceful message in unsupported browsers.

## File Structure

```
picture/
  index.html
  package.json
  vite.config.js
  src/
    main.jsx
    App.jsx                # Top-level view switching
    store/
      photoStore.js        # Zustand store
    services/
      photoLoader.js       # Directory picker + file enumeration
      exifParser.js        # EXIF extraction via exifr
      thumbnailer.js       # Canvas-based thumbnail generation
    components/
      PhotoLightbox.jsx    # Fullscreen viewer
    views/
      MapView.jsx          # Pure map mode
      TimelineView.jsx     # Pure timeline mode
      CombinedView.jsx     # Map + timeline split
    utils/
      geo.js               # Distance calc, bounds fitting, clustering helpers
```

## Open Questions

None — all design decisions resolved through clarification.
