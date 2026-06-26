## ADDED Requirements

### Requirement: Photo wall shows all photos in a time-ordered grid
The system SHALL display all photos (with and without GPS) in a proportional-thumbnail grid ordered by capture time, grouped by year, month, and day.

#### Scenario: Photos without GPS appear
- **WHEN** the photo dataset includes photos without GPS coordinates
- **THEN** those photos SHALL appear in the photo wall alongside geo-tagged photos, sorted by capture time

#### Scenario: Year/month/day grouping
- **WHEN** the photo wall is displayed
- **THEN** photos SHALL be grouped under year headers, with month sub-headers, and day markers within each month group

#### Scenario: Proportional thumbnail sizing
- **WHEN** photos have varying aspect ratios
- **THEN** each thumbnail SHALL maintain its original aspect ratio, filling its grid cell without cropping

### Requirement: Column count is adjustable
The system SHALL allow the user to adjust the number of thumbnail columns in the grid.

#### Scenario: Default column count
- **WHEN** the photo wall first loads
- **THEN** the grid SHALL default to 4 columns on desktop viewports

#### Scenario: Adjust columns
- **WHEN** user changes the column slider or control
- **THEN** the grid SHALL reflow to the selected column count between 2 and 8 columns

### Requirement: Scrolling preserves hierarchy
The system SHALL show year and month labels that remain visible during scrolling.

#### Scenario: Sticky headers
- **WHEN** user scrolls through the photo wall
- **THEN** the current year label SHALL remain pinned at the top of the viewport

### Requirement: Lightbox integration
The system SHALL integrate photo wall with existing PhotoLightbox component.

#### Scenario: Click to open lightbox
- **WHEN** user clicks a thumbnail in the photo wall
- **THEN** the lightbox SHALL open showing the clicked photo, with navigation constrained to the photo wall ordering

#### Scenario: Search and filter
- **WHEN** user enters a search term in the photo wall
- **THEN** the grid SHALL filter to matching photos by filename, date range, or camera model
