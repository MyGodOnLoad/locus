## ADDED Requirements

### Requirement: Trip detail header
The Trip Detail view SHALL display a header with the trip name (auto-generated or user-specified), date range, duration, photo count, and place summary.

#### Scenario: Header with auto-generated name
- **WHEN** the user opens a trip detail and the trip has no custom name
- **THEN** the header shows the auto-generated name (e.g., "Beijing → Shanghai")

### Requirement: Trip trajectory map
The Trip Detail view SHALL render a focused map showing the trip trajectory as a polyline with labeled start and end points, centered on the trip's bounding box.

#### Scenario: Trajectory map focused on trip
- **WHEN** the trip detail renders
- **THEN** the map is zoomed and centered to fit the trip's full trajectory

#### Scenario: Place name labels on map
- **WHEN** reverse geocoding results are available
- **THEN** the map shows place names at key points along the trajectory

### Requirement: Day-grouped photo stream
The Trip Detail view SHALL display all trip photos grouped by calendar day, with each day showing a date header, a location summary row, and a grid of photo thumbnails.

#### Scenario: Multi-day trip with day grouping
- **WHEN** a trip spans 3 days with photos on each day
- **THEN** the photo stream has 3 day sections, each with its own date header and photo grid

#### Scenario: Single day trip
- **WHEN** a trip spans only 1 day
- **THEN** the photo stream has 1 day section

### Requirement: Day location summary
Each day group SHALL display a summary of locations visited that day, derived from reverse geocoding results.

#### Scenario: Day with multiple locations
- **WHEN** a day's photos were taken in 3 different cities
- **THEN** the location summary reads "City A → City B → City C"

### Requirement: Photo lightbox in trip detail
Clicking a photo in the day-grouped stream SHALL open the existing PhotoLightbox component with navigation constrained to the trip's photos.

#### Scenario: Open lightbox from trip detail
- **WHEN** the user clicks a photo in the trip detail stream
- **THEN** the lightbox opens showing that photo, with prev/next navigating only within the trip

### Requirement: Trip detail navigation
The Trip Detail view SHALL include back navigation to return to the Trip List view.

#### Scenario: Navigate back to trip list
- **WHEN** the user clicks the back button in trip detail
- **THEN** the app switches to TripListView
