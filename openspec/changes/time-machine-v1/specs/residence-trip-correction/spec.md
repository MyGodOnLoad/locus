## ADDED Requirements

### Requirement: Rename residence or trip
The system SHALL allow the user to assign a custom name to any detected residence period or trip, persisted to `.locus-metadata.json`.

#### Scenario: User renames a residence
- **WHEN** the user edits the name of a residence from "Tianjin Period" to "南开时光"
- **THEN** the new name is saved to `.locus-metadata.json` and reflected in all views

### Requirement: Merge adjacent periods
The system SHALL allow the user to merge two adjacent residence periods or two adjacent trips into one combined period/trip.

#### Scenario: User merges two residences
- **WHEN** the user selects two adjacent residences and chooses "Merge"
- **THEN** the two residences are combined into one, with the union of all photos and the combined time span

### Requirement: Split a period at a boundary
The system SHALL allow the user to split a residence period or trip at a specified date boundary into two separate periods/trips.

#### Scenario: User splits a residence
- **WHEN** the user selects a residence and specifies a split date within its span
- **THEN** the residence is divided into two, with photos partitioned by the split date

### Requirement: Promote trip to residence
The system SHALL allow the user to promote a detected trip to a full residence period.

#### Scenario: User promotes a long trip
- **WHEN** the user promotes a 3-month trip to a residence
- **THEN** the trip moves from the trips list to the residence periods list

### Requirement: Demote residence to trip
The system SHALL allow the user to demote a residence to a trip within its parent residence context.

#### Scenario: User demotes a short residence
- **WHEN** the user demotes a detected residence that was actually a long trip
- **THEN** the residence moves from the residence periods list to the trips list

### Requirement: Ignore noise periods
The system SHALL allow the user to mark detected residences or trips as "ignored," hiding them from all views. Ignored periods SHALL be persisted in `.locus-metadata.json`.

#### Scenario: User ignores a false positive
- **WHEN** the user marks a spuriously detected trip as ignored
- **THEN** that trip disappears from the trip list and is not shown on the LifemapView

### Requirement: Correction persistence to .locus-metadata.json
All correction operations SHALL be written atomically to `.locus-metadata.json` in the photo directory root.

#### Scenario: Multiple corrections saved
- **WHEN** the user renames a residence and ignores a trip
- **THEN** both changes are persisted to `.locus-metadata.json`

#### Scenario: Metadata file read on startup
- **WHEN** the application loads photos from a directory
- **THEN** the system reads `.locus-metadata.json` from that directory and applies all overrides to the computed residence and trip data

### Requirement: Correction UI accessibility
The correction UI SHALL be accessible from both the LifemapView (by interacting with map elements) and the Trip List / Trip Detail views (via context menus or inline buttons).

#### Scenario: Correct trip from map
- **WHEN** the user right-clicks a trip trajectory on the LifemapView
- **THEN** a context menu appears with rename, ignore, and promote/demote options

#### Scenario: Correct trip from trip detail
- **WHEN** the user is viewing a trip detail
- **THEN** inline edit buttons are available for rename, ignore, and promote/demote
