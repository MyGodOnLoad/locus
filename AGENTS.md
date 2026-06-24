# Repository Guidelines

## Project Structure & Module Organization

```
src/
  components/   # Reusable UI pieces (PhotoCard, MapComponent, StatsPanel, etc.)
  views/        # Top-level page views (CombinedView, MapView, TimelineView)
  services/     # Data pipelines: EXIF parsing, geocoding, thumbnails, metadata
  store/        # Zustand state (photoStore.js)
  utils/        # Pure helpers (geo.js)
scripts/        # Regression test scripts
public/         # Static assets and debug pages
docs/           # Design specs and implementation plans
```

- `src/main.jsx` is the entry point; `src/App.jsx` owns the photo-loading workflow and view routing.
- Components receive state via `usePhotoStore` selectors; no prop drilling.
- Services are plain async modules — they do not import React or store.

## Build, Test, and Development Commands

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start Vite dev server on `localhost:3000` |
| `npm run build`   | Production build to `dist/`               |
| `npm run preview` | Serve the production build locally        |

Regression scripts in `scripts/` run directly with Node:

```sh
node scripts/geocoder.regression.mjs
```

No formal test framework is configured yet.

## Coding Style & Naming Conventions

- **Indentation**: 2 spaces.
- **Quotes**: Single quotes for strings.
- **Variables**: `var` (not `let`/`const`) — match existing code.
- **Component files**: PascalCase (`PhotoCard.jsx`).
- **Service/utility files**: camelCase (`geocoder.js`).
- **CSS**: Single `src/styles.css` with flat class selectors. Only add a separate stylesheet if a component truly warrants it.
- No linting/formatting tooling — keep code consistent with the repo.

## Testing Guidelines

- Manual smoke test: `npm run dev`, open a folder with geotagged photos, verify they render on map and timeline.
- Regression scripts in `scripts/` test individual services against known inputs. Add one for each new service.

## Commit & Pull Request Guidelines

- Commit messages are short and lowercase (e.g., `init: initial commit`).
- PRs should describe the change, link related issues, and include a screenshot if UI changed.

## Architecture Overview

- **State**: Single Zustand store holds photos, view mode, filters, and selection state.
- **Pipeline**: Folder selection → EXIF parsing (`exifr`) → thumbnail generation → metadata overrides → store.
- **Map**: Leaflet via `react-leaflet` with marker clustering. Geocoding is client-side in `services/geocoder.js`.
- **Views**: `CombinedView`, `MapView`, `TimelineView` render based on store filters; views never mutate store directly.
