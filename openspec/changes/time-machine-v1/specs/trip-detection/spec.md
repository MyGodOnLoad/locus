## ADDED Requirements

### Requirement: Detect trips within residence periods
The system SHALL identify trips as contiguous excursion segments within a residence period. Each trip has a start time, end time, bounding path, centroid, and associated photo count.

#### Scenario: Single trip within residence
- **WHEN** a residence contains one excursion segment meeting the minimum photo and duration thresholds
- **THEN** the system produces exactly one trip with all photos from that excursion

#### Scenario: Multiple non-overlapping trips
- **WHEN** a residence contains three distinct excursion segments, each meeting minimum thresholds
- **THEN** the system produces three separate trips, each with its own photos and trajectory

#### Scenario: Trip attributes populated
- **WHEN** a trip is detected
- **THEN** the trip object includes: startTime, endTime, photos (array), path (ordered lat/lng points), centroid, boundingBox, and an auto-generated ID

### Requirement: Compute trip trajectory from photo coordinates
The system SHALL generate the trip trajectory as an ordered array of unique lat/lng points derived from the chronologically sorted photos in the trip.

#### Scenario: Photos at distinct locations
- **WHEN** a trip contains 5 photos at 5 different locations
- **THEN** the trajectory contains 5 points ordered by photo timestamp

#### Scenario: Multiple photos at same location
- **WHEN** a trip contains 10 photos where 3 share the same coordinates
- **THEN** the trajectory contains 1 point for that location, not 3

### Requirement: Assign trip cover photo
The system SHALL automatically select a cover photo for each trip as the chronologically middle photo in the trip.

#### Scenario: Trip with 5 photos
- **WHEN** a trip has 5 photos sorted by time
- **THEN** the cover photo is the 3rd photo (index 2)

### Requirement: Recompute trips on photo set change
The system SHALL recompute all trips whenever the underlying photo array changes (photos added, removed, or metadata updated).

#### Scenario: New photos added to folder
- **WHEN** the user adds photos to the folder and reloads
- **THEN** trips are fully recomputed incorporating the new photos
