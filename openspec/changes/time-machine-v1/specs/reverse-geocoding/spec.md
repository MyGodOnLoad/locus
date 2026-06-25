## ADDED Requirements

### Requirement: Batch reverse geocode coordinates
The system SHALL accept an array of latitude/longitude pairs and return corresponding place-name results (city, district, province) by calling the Amap (高德) reverse geocoding API in batches.

#### Scenario: Batch of 10 coordinates
- **WHEN** the service receives 10 lat/lng pairs
- **THEN** the service returns 10 place-name results, one per coordinate

#### Scenario: Empty input
- **WHEN** the service receives an empty array
- **THEN** the service returns an empty array without making any API calls

### Requirement: localStorage cache with coordinate keying
The system SHALL cache reverse geocoding results in localStorage keyed by latitude/longitude rounded to 4 decimal places. Before making an API call, the service SHALL check the cache and skip already-resolved coordinates.

#### Scenario: Cache hit
- **WHEN** reverse geocoding is requested for coordinates already in the cache
- **THEN** the service returns the cached result without making an API call

#### Scenario: Partial cache hit
- **WHEN** 5 of 10 requested coordinates are cached and 5 are not
- **THEN** the service returns 5 from cache and fetches 5 from the API

### Requirement: API rate limiting
The system SHALL insert a minimum 200ms delay between consecutive Amap API calls to respect rate limits.

#### Scenario: Sequential API calls
- **WHEN** 5 API calls are needed
- **THEN** the total time is at least 1000ms (5 × 200ms)

### Requirement: Handle API errors gracefully
The system SHALL return a fallback result (coordinates as string) when the Amap API returns an error or times out, without blocking the overall batch operation.

#### Scenario: API returns error for one coordinate
- **WHEN** the API fails for one coordinate in a batch of 10
- **THEN** that coordinate returns "39.9, 116.4" as the fallback and the other 9 return normal place names

### Requirement: Amap API key configuration
The system SHALL read the Amap API key from a configurable source (environment variable or app configuration), falling back to a development key for local use.

#### Scenario: No API key configured
- **WHEN** no Amap API key is set
- **THEN** the service logs a warning and returns coordinate strings for all results
