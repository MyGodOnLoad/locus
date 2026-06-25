## ADDED Requirements

### Requirement: LifemapView as default entry point
The system SHALL render LifemapView as the default view when the application loads, replacing the existing CombinedView as the primary interface.

#### Scenario: App loads with no prior view preference
- **WHEN** the application starts for the first time after the update
- **THEN** LifemapView is displayed as the active view

### Requirement: Residence heatmap layer
The system SHALL render a heatmap layer on the Leaflet map showing the density of photos within each residence period, using a distinct color gradient for each residence.

#### Scenario: Two residences with distinct heatmaps
- **WHEN** the user has photos from two residence periods
- **THEN** the map shows two heatmap clusters in different geographic regions

#### Scenario: Heatmap updates on zoom
- **WHEN** the user zooms the map in or out
- **THEN** the heatmap layer re-renders at the appropriate density for the zoom level

### Requirement: Trip trajectory layer
The system SHALL render trip trajectories as polylines on the map, with distinct colors per trip, and place-name labels at the start and end of each trajectory.

#### Scenario: Trip rendered as polyline
- **WHEN** a detected trip has trajectory points
- **THEN** the map shows a colored polyline connecting those points in chronological order

#### Scenario: Trip label shows city name
- **WHEN** reverse geocoding results are available for the trip's start and end points
- **THEN** the map labels the trajectory with "City A → City B"

### Requirement: Photo scatter layer
The system SHALL render small thumbnail markers at photo locations across all photos, with clustering at low zoom levels to avoid overcrowding.

#### Scenario: Clustered markers at low zoom
- **WHEN** the map is zoomed out to show a continent
- **THEN** photos are grouped into cluster markers showing photo count

#### Scenario: Individual markers at high zoom
- **WHEN** the map is zoomed in to street level
- **THEN** individual photo thumbnail markers are displayed

### Requirement: Time cursor
The system SHALL provide a draggable time cursor widget at the bottom of the LifemapView that filters visible map layers to the selected time window.

#### Scenario: Drag time cursor to narrow window
- **WHEN** the user drags the time cursor handles to show only 2023
- **THEN** the map layers (heatmap, trajectories, scatter) update to only show data from 2023

#### Scenario: Default time window
- **WHEN** LifemapView first renders
- **THEN** the time cursor spans the full date range of all loaded photos

### Requirement: Layer visibility controls
The system SHALL provide toggle controls for each map layer (heatmap, trajectories, scatter) allowing the user to show or hide individual layers.

#### Scenario: User hides trajectory layer
- **WHEN** the user toggles off the trajectory layer
- **THEN** all trajectory polylines disappear from the map while heatmap and scatter layers remain visible

### Requirement: Map tile switcher
The system SHALL support switching between Amap (高德), CartoDB, and OpenStreetMap tile layers via a layer control in the map corner.

#### Scenario: Switch to OSM tiles
- **WHEN** the user selects OpenStreetMap from the tile layer control
- **THEN** the map re-renders using OSM tiles
