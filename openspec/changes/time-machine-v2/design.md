## Context

After time-machine-v1, the app has a working P0 skeleton: residence detection, lifemap (heatmap + trajectories + scatter + time cursor), trip list/detail views, and manual correction UI. The current state:

- **TripDetailView** shows static trajectory and day-grouped photos — no animation
- **AllPhotosView** only shows photos with GPS (filtered by `photos` store), not all photos
- **CombinedView** exists in code but is no longer wired as a tab — the tab is labeled "地图+时间轴" but routes to `combined` view mode; it works but was demoted in the nav restructure
- **Story engine** and **export** are entirely absent
- **EXIF** fields (aperture, shutter, ISO, etc.) are parsed by `exifParser.js` but some are discarded in `App.jsx` photo assembly; no detail panel exists
- **Heart (心标)** logic exists in `photoStore.js` and `PhotoCard.jsx`, but verification across all views is pending

Stack: React 18 + Vite, Zustand, Leaflet (react-leaflet), exifr. No TypeScript, 2-space indent, single quotes, `var` declarations.

## Goals / Non-Goals

**Goals:**
- Add trip replay animation to TripDetailView (fly-to, trajectory trace, photo pop-ups)
- Build photo wall timeline replacing current AllPhotosView (all photos, year/month/day grid)
- Restore CombinedView as an independent tab
- Implement 6-type story engine with dedicated StoryView
- Implement HTML trip diary export and GPX export from trip
- Add EXIF detail panel to PhotoLightbox
- Verify heart UI works correctly across all views

**Non-Goals:**
- Video support, slideshow, keyboard shortcuts, mobile responsive (P3 — deferred)
- IndexedDB caching, content-addressed photo IDs, RAW preview (not in product-direction.md v1)
- XMP tag reading, file system sync, GPX import, side-by-side comparison (not in product-direction.md v1)
- Multi-folder aggregation, duplicate detection

## Decisions

### 1. Replay: requestAnimationFrame + Leaflet panTo

**Choice:** Use `requestAnimationFrame` for the animation loop, driving Leaflet `map.panTo()` and incremental polyline drawing.

**Rationale:** No extra library needed. Leaflet's `panTo()` already provides smooth transitions. The animation loop steps through photo timestamps, drawing trajectory segments by splitting the full polyline and updating a Leaflet `L.polyline`. Simple, reliable, no new dependency.

**Alternative considered:** GSAP or framer-motion → rejected; those are for DOM animations, not Leaflet map control. Leaflet's own animation primitives suffice.

### 2. Photo wall: CSS Grid + sticky headers

**Choice:** Pure CSS Grid with `grid-template-columns: repeat(N, 1fr)` and `grid-auto-rows` for the thumbnail grid. Year headers use `position: sticky; top: 0`.

**Rationale:** CSS Grid handles proportional thumbnails natively via `object-fit: cover` on `<img>` with their natural aspect ratio respected through `grid-row: span <ratio>`. No virtualization library needed — even 5000 thumbnails at 150px render within browser capability with lazy loading (`loading="lazy"`).

**Alternative considered:** `react-virtualized` or `react-window` → rejected; adds complexity for a use case that browsers handle well natively when photos are lazily loaded.

### 3. Story engine: pure computed from existing data

**Choice:** `storyEngine.js` is a pure function: `generateStories(photos, residences, trips, events) → StoryCard[]`. Each story type is a sub-generator. No persistence — stories are recomputed on each view.

**Rationale:** Stories are deterministic given the input data, same as residences and trips. Caching story results adds sync complexity with no real benefit — the computation is O(n) scans through already-loaded data.

**Structure:**
```
StoryCard {
  type: 'duration' | 'spatial' | 'density' | 'contrast' | 'discovery' | 'milestone'
  title: string
  summary: string
  coverPhotoId: string
  targetType: 'trip' | 'residence' | 'photo-set'
  targetId: string
}
```

### 4. HTML export: template literal + base64 images

**Choice:** Generate a complete HTML string via template literal, embedding photos as base64 data URIs. Use Leaflet CDN links for map — the file is self-contained except for map tiles (which need network, documented as a limitation).

**Rationale:** Base64 embedding makes the file truly portable. The file size is acceptable for a trip diary (typically 50-200 photos, ~5-20MB total). Template literals are simpler than a DOM builder or SSR approach for a single-file output.

**Alternative considered:** Write photos as separate files in a ZIP → rejected; adds complexity and the single-file property is valuable for sharing.

### 5. GPX export: XML template literal

**Choice:** Build GPX 1.1 XML string from trip waypoints. Each photo with GPS becomes a `<wpt>` element. Download via `Blob` + `URL.createObjectURL`.

**Rationale:** GPX is simple XML. No library needed — the schema is straightforward. `file-saver` dependency added for cross-browser download reliability.

### 6. EXIF panel: expandable sidebar in lightbox

**Choice:** Add a toggle button in PhotoLightbox. When open, a side panel slides in from the right showing structured EXIF data. Panel updates when navigating between photos.

**Rationale:** Side panel keeps the photo visible while browsing EXIF data. A modal overlay would obscure the photo being inspected.

### 7. CombinedView: restore as tab without structural changes

**Choice:** Update App.jsx tab bar to include "地图+时间轴" tab routing to `combined` view mode. No changes to CombinedView component itself.

**Rationale:** CombinedView already works correctly as a view. It was only hidden by the v1 nav restructure. Restoring it is a one-line change in App.jsx.

### 8. View tab reorder

**Choice:** Tab order: 生命轨迹 | 旅行 | 故事 | 地图+时间轴 | 全部照片

**Rationale:** 
- 生命轨迹 remains default (P0 primary view)
- 旅行 is the second most important navigation axis
- 故事 is new P2 content, placed after core navigation
- 地图+时间轴 is a utility view for combined browsing
- 全部照片 is the fallback for all-photo browsing

## Risks / Trade-offs

- **Replay performance with many photos** → Mitigation: cap replay photo pop-ups at 1 per second when photos are densely clustered; skip intermediate positions
- **HTML export file size** → Mitigation: resize thumbnails to 800px max dimension before base64 encoding; document file size expectations
- **Story engine quality** → Mitigation: stories are rule-based, not LLM-generated; quality is acceptable for P2 — the product direction explicitly defines rule-based stories
- **Photo wall without virtualization** → Mitigation: `loading="lazy"` on images + 150px thumbnails; if performance issues arise for 10K+ photo sets, add IntersectionObserver-based virtualization later
