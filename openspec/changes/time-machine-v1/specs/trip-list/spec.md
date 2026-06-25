## ADDED Requirements

### Requirement: Trip card list sorted by recency
The system SHALL display all detected trips as a scrollable list of cards, sorted by start date in reverse chronological order (most recent first).

#### Scenario: Multiple trips displayed
- **WHEN** 5 trips are detected
- **THEN** the trip list shows 5 cards with the most recent trip at the top

#### Scenario: Empty trip list
- **WHEN** no trips are detected (e.g., only residence photos)
- **THEN** the list shows an empty state message indicating no trips found

### Requirement: Trip card content
Each trip card SHALL display: cover photo thumbnail, trip date range (start → end), trip duration, place summary (city/region names from reverse geocoding), and photo count.

#### Scenario: Fully populated trip card
- **WHEN** a trip has a cover photo, date range, and geocoded location names
- **THEN** the card shows all fields: thumbnail, "Jun 2023 → Jun 2023", "3 days", "Beijing → Shanghai", and "42 photos"

#### Scenario: Trip without geocoding data
- **WHEN** reverse geocoding data is unavailable for a trip
- **THEN** the card shows coordinates instead of place names (e.g., "39.9,116.4 → 31.2,121.5")

### Requirement: Trip card navigation
Clicking a trip card SHALL navigate to the Trip Detail view for that trip.

#### Scenario: User clicks trip card
- **WHEN** the user clicks on a trip card in the list
- **THEN** the app switches to TripDetailView showing that trip's data

### Requirement: Navigate back to trip list
The Trip List view SHALL include a back button or navigation element that returns to the LifemapView.

#### Scenario: Return to map
- **WHEN** the user clicks the back button from the trip list
- **THEN** the app switches back to LifemapView
