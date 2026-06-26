## ADDED Requirements

### Requirement: Story engine generates six story types
The system SHALL automatically generate stories from photo data and display them as narrative cards.

#### Scenario: Duration story generation
- **WHEN** a residence period spans more than 6 months
- **THEN** the system SHALL generate a duration story with the period name, date range, photo count, and a one-sentence summary

#### Scenario: Spatial span story generation
- **WHEN** a trip covers more than 100 km
- **THEN** the system SHALL generate a spatial span story with origin, destination, distance, and photo count

#### Scenario: Density story generation
- **WHEN** a single day contains more than the event density threshold photos
- **THEN** the system SHALL generate a density story with the date, location, photo count, and a one-sentence description

#### Scenario: Contrast story generation
- **WHEN** two trips visit the same location at different times
- **THEN** the system SHALL generate a contrast story showing both trips side by side with dates, photo counts, and a comparison note

#### Scenario: Discovery story generation
- **WHEN** a location appears only once across all trips
- **THEN** the system SHALL generate a discovery story with the location name, date, and trip context

#### Scenario: Milestone story generation
- **WHEN** the dataset spans more than 3 years or crosses significant life boundaries
- **THEN** the system SHALL generate milestone stories for notable transitions (longest residence, first trip, most-traveled year)

### Requirement: Story view displays story cards
The system SHALL provide a dedicated "故事" view showing generated story cards.

#### Scenario: Story card layout
- **WHEN** user navigates to the story view
- **THEN** story cards SHALL display in a responsive grid, each card showing a cover thumbnail, story type icon, title, and summary

#### Scenario: Story card click navigates to context
- **WHEN** user clicks a story card
- **THEN** the system SHALL navigate to the relevant trip detail, residence period, or photo set that the story references

#### Scenario: No stories state
- **WHEN** the dataset is too small to generate any stories (fewer than 50 photos or no trips)
- **THEN** the story view SHALL show a message indicating insufficient data for stories
