## ADDED Requirements

### Requirement: Detect residence periods from GPS-tagged photos
The system SHALL partition all GPS-tagged photos into residence periods using DBSCAN spatial clustering with a minimum temporal span of 60 days. A residence period represents a geographic area where the user lived for an extended time.

#### Scenario: Single residence cluster detected
- **WHEN** the user loads photos all taken within a 5km radius over 3 months
- **THEN** the system identifies exactly one residence period spanning those 3 months

#### Scenario: Two geographically separated residences
- **WHEN** the user loads photos from Tianjin (14 months) and Beijing (11 months) with a gap between them
- **THEN** the system identifies two distinct residence periods, each bounded to its geographic cluster

#### Scenario: Short stay does not form a residence
- **WHEN** the user has 5 photos from a city visited for only 3 days
- **THEN** the system does NOT classify it as a residence period

### Requirement: Detect excursions outside residence areas
The system SHALL identify contiguous segments of photos taken more than a configurable distance (default 5km) from the residence centroid and lasting at least 4 hours with at least 3 photos.

#### Scenario: Weekend trip detected
- **WHEN** within a residence period, the user takes 15 photos 50km away over a continuous 8-hour window
- **THEN** the system marks that segment as an excursion (candidate trip)

#### Scenario: Brief outing is not a trip
- **WHEN** within a residence period, the user takes 2 photos 6km away over 1 hour
- **THEN** the system does NOT mark it as an excursion (fails minimum photo count)

### Requirement: Merge adjacent excursion gaps
The system SHALL merge excursion segments that are separated by gaps shorter than 48 hours into a single trip.

#### Scenario: Two-day trip with overnight gap
- **WHEN** the user takes photos on a Saturday trip 30km away and more on Sunday in the same area, with an overnight gap
- **THEN** the system merges both days into a single trip

### Requirement: Detect migration periods between residences
The system SHALL classify photo segments between two residence periods as migration periods. If the migration segment's distance from both residences exceeds a threshold, it SHALL be treated as an independent trip.

#### Scenario: Migration between cities
- **WHEN** photos exist between the end of Tianjin residence and start of Beijing residence
- **THEN** the system marks those photos as a migration period

### Requirement: Configurable detection parameters
The system SHALL accept and apply these parameters with documented defaults:
- `spatial.clusterEps`: 0.5 km
- `spatial.minClusterPts`: 5
- `residence.minDuration`: 60 days
- `residence.minPhotosPerMonth`: 3
- `excursion.maxGapHours`: 48
- `excursion.minPhotos`: 3
- `event.densityThreshold`: 20

#### Scenario: Custom parameters applied
- **WHEN** a service caller provides non-default parameter values
- **THEN** the detection engine uses those values instead of defaults
