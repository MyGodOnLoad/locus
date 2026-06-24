# Photo Album App ^#^#^# Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a local photo browser SPA with Map, Timeline, and Map+Timeline combined views.

**Architecture:** React 18 SPA built with Vite. Zustand for centralized photo state across all views. Leaflet for maps with marker clustering. exifr for client-side EXIF parsing (GPS + DateTimeOriginal). Canvas API for thumbnail generation.

**Tech Stack:** React 18, Vite 5, Leaflet + react-leaflet + leaflet.markercluster, exifr, Zustand

---

### Task 0: Project Scaffold

**Files:** Create package.json, vite.config.js, index.html, src/main.jsx, src/App.jsx, src/styles.css

- [ ] Step 1: Scaffold with Vite React template, install deps (leaflet, react-leaflet, leaflet.markercluster, exifr, zustand)
- [ ] Step 2: Create directory structure: src/services, src/store, src/components, src/views, src/utils

### Task 1: Photo Loader Service (src/services/photoLoader.js)

- [ ] Step 1: Implement selectDirectory() using showDirectoryPicker()
- [ ] Step 2: Implement scanDirectory() recursive file enumeration with supported extensions filter
- [ ] Step 3: Implement readFileData() returning ArrayBuffer + Blob URL

### Task 2: EXIF Parser Service (src/services/exifParser.js)

- [ ] Step 1: Implement parseExif(arrayBuffer) using exifr for GPS, DateTimeOriginal, Make, Model
- [ ] Step 2: Normalize GPS coordinates with hemisphere refs, normalize datetime fallback chain

### Task 3: Thumbnailer Service (src/services/thumbnailer.js)

- [ ] Step 1: Implement generateThumbnail(blobUrl) using Canvas API, max 300px dimension, JPEG 0.7 quality

### Task 4: Geo Utils (src/utils/geo.js)

- [ ] Step 1: Implement haversineDistance, boundsForPoints, clusterPoints functions

### Task 5: Photo Store (src/store/photoStore.js)

- [ ] Step 1: Implement Zustand store with photos, viewMode, filters, derived getters (getFilteredPhotos, getGeotaggedPhotos)

### Task 6: App Entry Point (src/App.jsx, src/main.jsx)

- [ ] Step 1: Wire folder picker -> parse -> thumbnail pipeline into store
- [ ] Step 2: View mode switching header with three tabs + Open Folder button
- [ ] Step 3: Render CombinedView / MapView / TimelineView based on viewMode

### Task 7: Map View (src/views/MapView.jsx, src/components/MapComponent.jsx)

- [ ] Step 1: MapComponent with Leaflet map, OpenStreetMap tiles, marker cluster group
- [ ] Step 2: MapView wrapper with geotagged-photo-only filtering, GPS info banner, lightbox integration
- [ ] Step 3: Marker popup with thumbnail, bounds-changed event forwarding

### Task 8: Timeline View (src/views/TimelineView.jsx)

- [ ] Step 1: Sort photos by datetime descending, group by year -> month
- [ ] Step 2: Render photo grid per month group, sticky year headers
- [ ] Step 3: Year jump bar on right side for fast navigation
- [ ] Step 4: Unknown-date photos section with file modified-time fallback badge

### Task 9: Photo Lightbox (src/components/PhotoLightbox.jsx)

- [ ] Step 1: Fullscreen overlay with prev/next navigation, keyboard shortcuts (Escape/Arrow keys)
- [ ] Step 2: EXIF metadata display (date, camera make/model, position counter)

### Task 10: PhotoCard Component (src/components/PhotoCard.jsx)

- [ ] Step 1: Reusable thumbnail card with no-GPS badge and time-source badge

### Task 11: Combined View (src/views/CombinedView.jsx)

- [ ] Step 1: 60/40 split: map above, filtered timeline below
- [ ] Step 2: Map bounds-changed filters timeline photos to visible map area
- [ ] Step 3: Timeline month headers show photo count, lightbox integration

### Task 12: Global Styles (src/styles.css)

- [ ] Step 1: App layout (header, view area), timeline styles, photo grid, lightbox, year jump, map banners

### Task 13: Final Integration & Verification

- [ ] Step 1: Verify all three view modes with sample photo folder
- [ ] Step 2: Test keyboard navigation in lightbox
- [ ] Step 3: Test combined view map-timeline linkage
- [ ] Step 4: Test edge cases: no-GPS photos, no-datetime photos, non-image files
