## ADDED Requirements

### Requirement: User can replay a trip with animated map
The system SHALL provide a replay mode within TripDetailView that animates the map through the trip's trajectory in chronological order.

#### Scenario: Start replay
- **WHEN** user clicks the replay button in TripDetailView
- **THEN** the map transitions to replay mode with a playback control bar visible, map flies to the first photo location, and the first photo briefly appears

#### Scenario: Trajectory draws progressively
- **WHEN** replay plays forward
- **THEN** the trajectory polyline SHALL draw segment by segment from start to current position, not appear all at once

#### Scenario: Photo pop-ups during replay
- **WHEN** the replay timeline reaches a photo's capture time
- **THEN** that photo SHALL pop up as a thumbnail overlay on the map near its location for 2 seconds, then fade out

#### Scenario: End of replay
- **WHEN** replay reaches the last photo in the trip
- **THEN** the system SHALL stop automatically and show a "replay complete" indicator

### Requirement: Playback controls
The system SHALL provide playback controls during replay mode.

#### Scenario: Play/Pause toggle
- **WHEN** user clicks play/pause button
- **THEN** the animation SHALL toggle between running and paused

#### Scenario: Speed adjustment
- **WHEN** user selects a speed (1x, 2x, 5x, 10x)
- **THEN** the replay SHALL advance at the selected multiplier relative to real time

#### Scenario: Seek to position
- **WHEN** user drags the progress slider
- **THEN** the map SHALL jump to the corresponding point in the trajectory and show photos at that position

#### Scenario: Exit replay
- **WHEN** user clicks the close/exit button
- **THEN** the map SHALL return to the standard trip detail view with full trajectory visible

### Requirement: Replay map behavior
The map SHALL behave predictably during replay.

#### Scenario: Auto-center during replay
- **WHEN** replay advances to a new photo location
- **THEN** the map SHALL smoothly pan to keep the current position centered

#### Scenario: Zoom stability
- **WHEN** replay is running
- **THEN** the map zoom level SHALL remain at the user's last manual zoom, not auto-zoom between locations
