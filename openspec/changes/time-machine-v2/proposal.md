## Why

`time-machine-v1` established the product skeleton: residence detection, life trajectory map, trip list and detail, and manual correction. The P0 identity is in place. But the experience is still skeletal — trips are static lists, "全部照片" shows only geo-tagged photos with no time-based browsing, CombinedView was removed instead of retained as its own tab, and the product's P1/P2 promises (replay, stories, export) are untouched. This change completes the "时光机" experience from a working skeleton into a product that delivers on its emotional promise of reliving memories.

## What Changes

- Add **trip replay** with animated map fly-to, trajectory trace drawing, photo pop-ups, and speed control
- Add a **photo wall timeline** view for "全部照片" — proportional thumbnails in a configurable-column grid, showing every photo regardless of GPS status, with year→month→day scrolling
- **Restore CombinedView** as its own tab (地图+时间轴), not replaced or hidden
- Add **story engine** with six auto-generated story types (duration, space, density, contrast, discovery, milestone)
- Add **trip diary HTML export** — self-contained single-file with inline map, trajectory, and photos
- Add **GPX export** from trip trajectory
- Add **EXIF detail panel** in lightbox showing full EXIF metadata
- Verify and polish existing **heart (心标)** UI across all views

## Capabilities

### New Capabilities

- `trip-replay`: Animated map playback with fly-to transitions, trajectory tracing, photo pop-ups at capture time, and play/pause/speed controls
- `photo-wall`: Proportional-thumbnail grid showing all photos regardless of GPS status, organized by year → month → day, with adjustable column count
- `story-engine`: Six story generators (duration, spatial span, density, contrast, discovery, milestone) producing story cards from photo data, displayed in a dedicated "故事" view
- `trip-export`: Self-contained HTML trip diary export with inline map, trajectory polyline, and embedded photos; plus GPX file generation from trip waypoints
- `exif-panel`: Detail panel inside PhotoLightbox showing full EXIF metadata (aperture, shutter, ISO, focal length, 35mm equivalent, flash, exposure bias, metering mode, altitude, geo source)

## Impact

- **New services**: `storyEngine.js`, `tripExporter.js`, `replayController.js`
- **New views**: `StoryView.jsx`
- **New components**: `ReplayController.jsx`, `PhotoWall.jsx`, `StoryCard.jsx`, `ExifPanel.jsx`
- **Modified**: `AllPhotosView.jsx` (photo wall), `App.jsx` (tabs + CombinedView), `PhotoLightbox.jsx` (EXIF panel), `TripDetailView.jsx` (replay integration), `styles.css`
- **Dependencies**: `file-saver` for GPX/HTML download
- **No breaking changes**: CombinedView restored; existing views preserved

## Impact

- **New services**: `storyEngine.js`, `tripExporter.js`, `replayController.js`
- **New views**: `StoryView.jsx`
- **New components**: `ReplayController.jsx`, `PhotoWall.jsx`, `StoryCard.jsx`, `ExifPanel.jsx`
- **Modified**: `AllPhotosView.jsx` (photo wall), `App.jsx` (tabs + CombinedView), `PhotoLightbox.jsx` (EXIF panel), `TripDetailView.jsx` (replay integration), `styles.css`
- **Dependencies**: `file-saver` for GPX/HTML download
- **No breaking changes**: CombinedView restored; existing views preserved