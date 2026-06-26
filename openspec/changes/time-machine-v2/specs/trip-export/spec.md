## ADDED Requirements

### Requirement: HTML trip diary export
The system SHALL export a trip as a self-contained HTML file with inline map, trajectory, and photos.

#### Scenario: Export single trip to HTML
- **WHEN** user clicks "导出旅行日记" on a trip detail view
- **THEN** the system SHALL generate and download a single HTML file containing: an embedded Leaflet map centered on the trip, a trajectory polyline, all trip photos as inline base64 thumbnails, and day-grouped photo captions with timestamps

#### Scenario: Exported file is self-contained
- **WHEN** the exported HTML file is opened in a browser without network access
- **THEN** the map SHALL render correctly (using bundled Leaflet CSS/JS from CDN links with offline fallback), all photos SHALL display, and all styling SHALL be preserved

#### Scenario: Export with place names
- **WHEN** reverse geocoding data is available for the trip
- **THEN** the exported HTML SHALL include place name labels on the map and in day headers

### Requirement: GPX export from trip
The system SHALL export a trip's GPS track as a standard GPX file.

#### Scenario: Export GPX from trip
- **WHEN** user clicks "导出 GPX" on a trip detail view
- **THEN** the system SHALL generate and download a valid GPX 1.1 file containing all photo waypoints in chronological order with lat, lon, elevation (if available), and timestamp

#### Scenario: GPX includes metadata
- **WHEN** a GPX file is exported
- **THEN** the file SHALL include a <metadata> section with the trip name and date range as <name> and <desc> elements

#### Scenario: Trip with no GPS photos
- **WHEN** user attempts to export GPX on a trip where no photos have GPS coordinates
- **THEN** the system SHALL show an error message indicating GPX export is unavailable for this trip
