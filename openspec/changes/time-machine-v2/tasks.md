## 1. EXIF Data Foundation

- [x] 1.1 Update `exifParser.js` to parse and return all fields: FNumber, ExposureTime, ISO, FocalLength, FocalLengthIn35mm, Flash, ExposureBias, MeteringMode, ExposureProgram, LensModel, GPSAltitude, Orientation
- [x] 1.2 Update `App.jsx` photo assembly to store all new EXIF fields in photo objects (no field discarding)
- [x] 1.3 Apply EXIF orientation to image display via CSS image-orientation property

## 2. CombinedView Restoration & Tab Reorder

- [x] 2.1 Add "地图+时间轴" tab back to App.jsx header, routing to `combined` view mode
- [x] 2.2 Reorder tabs to: 生命轨迹 | 旅行 | 故事 | 地图+时间轴 | 全部照片
- [x] 2.3 Add "故事" tab entry in App.jsx (wiring StoryView when built)
- [x] 2.4 Verify CombinedView renders correctly as a standalone tab

## 3. Photo Wall (全部照片)

- [x] 3.1 Create `PhotoWall.jsx` with CSS Grid layout, proportional thumbnails (aspect-ratio preserved), lazy loading
- [x] 3.2 Implement year/month/day grouping with sticky year headers
- [x] 3.3 Add adjustable column count control (slider or segmented control, 2-8 columns)
- [x] 3.4 Add basic search/filter bar (filename, date range, camera model)
- [x] 3.5 Rewrite `AllPhotosView.jsx` to use PhotoWall instead of current geo-filtered view
- [x] 3.6 Wire PhotoWall click to open PhotoLightbox with correct photo index
- [x] 3.7 Update `styles.css` for photo wall layout, sticky headers, filter bar

## 4. EXIF Detail Panel

- [x] 4.1 Create `ExifPanel.jsx` component with structured sections: shooting params, equipment, file info, geo source
- [x] 4.2 Integrate ExifPanel into PhotoLightbox as a toggleable side panel
- [x] 4.3 Handle missing EXIF fields gracefully (show "—" instead of zero)
- [x] 4.4 Update `styles.css` for ExifPanel layout and transitions

## 5. Trip Replay

- [x] 5.1 Create `replayController.js` with requestAnimationFrame animation loop, play/pause/seek logic
- [x] 5.2 Create `ReplayController.jsx` UI component with play/pause button, speed selector (1x/2x/5x/10x), progress slider, exit button
- [x] 5.3 Integrate replay into `TripDetailView.jsx`: add replay button, replace static map with replay mode map
- [x] 5.4 Implement trajectory progressive drawing (split polyline and update per frame)
- [x] 5.5 Implement photo pop-up overlays during replay (thumbnail at map location, 2s display, fade out)
- [x] 5.6 Add map panTo smoothing between replay positions
- [x] 5.7 Update `styles.css` for ReplayController overlay and photo pop-ups

## 6. Story Engine

- [x] 6.1 Create `storyEngine.js` with six sub-generators: duration, spatial, density, contrast, discovery, milestone
- [x] 6.2 Create `StoryCard.jsx` component with cover thumbnail, story type icon, title, summary
- [x] 6.3 Create `StoryView.jsx` with responsive story card grid
- [x] 6.4 Wire story card clicks to navigate to relevant trip/residence/photo-set
- [x] 6.5 Add empty state for insufficient data (< 50 photos or no trips)
- [x] 6.6 Write `scripts/storyEngine.regression.mjs` test
- [x] 6.7 Update `styles.css` for story cards, grid, and empty state
- [x] 6.8 Add "故事" tab to App.jsx ViewRouter (wired to StoryView)

## 7. Trip Export

- [x] 7.1 Install `file-saver` npm dependency
- [x] 7.2 Create `tripExporter.js` with HTML diary export (Leaflet CDN map, base64 photos, day-grouped layout)
- [x] 7.3 Create `tripExporter.js` GPX 1.1 export (XML template with waypoints and metadata)
- [x] 7.4 Add export buttons to TripDetailView: "导出旅行日记" and "导出 GPX"
- [x] 7.5 Handle GPX export unavailable state for trips without GPS photos
- [x] 7.6 Write `scripts/tripExporter.regression.mjs` test

## 8. Heart UI Verification & Polish

- [x] 8.1 Verify heart toggle works in AllPhotosView/PhotoWall thumbnails
- [x] 8.2 Verify heart state persists correctly in `.locus-metadata.json`
- [x] 8.3 Add hearted-only filter to PhotoWall (if not already present)
- [x] 8.4 Verify heart icon visible and functional in TripDetailView photo stream

## 9. Integration & Smoke Test

- [x] 9.1 End-to-end dev smoke test: open folder, verify all 5 tabs render, trip replay animates, stories generate, export downloads files
- [x] 9.2 Verify CombinedView tab works independently of lifemap
- [x] 9.3 Verify photo wall shows photos without GPS
- [x] 9.4 Verify no regression in existing P0 functionality (residence detection, lifemap, trip list, corrections)
- [x] 9.5 Update `README.md` with new feature descriptions
