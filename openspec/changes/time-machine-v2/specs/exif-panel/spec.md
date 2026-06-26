## ADDED Requirements

### Requirement: EXIF detail panel in lightbox
The system SHALL display full EXIF metadata in an expandable panel within PhotoLightbox.

#### Scenario: Open EXIF panel
- **WHEN** user clicks an info/details button in the lightbox
- **THEN** a side panel or overlay SHALL appear showing EXIF metadata for the current photo

#### Scenario: Shooting parameters displayed
- **WHEN** the EXIF panel is open
- **THEN** the following parameters SHALL be displayed when available: aperture (f-number), shutter speed, ISO, focal length, 35mm equivalent focal length, flash status, exposure bias, metering mode, exposure program

#### Scenario: Equipment information displayed
- **WHEN** the EXIF panel is open
- **THEN** camera make and model SHALL be displayed, and lens model SHALL be displayed when available in EXIF data

#### Scenario: File and geo information displayed
- **WHEN** the EXIF panel is open
- **THEN** the following SHALL be displayed: image dimensions, file size, GPS altitude (if available), and coordinate source indicator (EXIF / GPX interpolated / manual)

#### Scenario: Missing EXIF handled gracefully
- **WHEN** a photo has no EXIF data for a particular field
- **THEN** that field SHALL display "—" or be omitted rather than showing zero or empty

#### Scenario: Panel closes
- **WHEN** user clicks the close button or navigates to another photo
- **THEN** the EXIF panel SHALL close

### Requirement: EXIF fields parsed and stored
The system SHALL parse and store all relevant EXIF fields from photo files.

#### Scenario: Full EXIF parsing on load
- **WHEN** photos are loaded from a folder
- **THEN** the system SHALL extract and store: FNumber, ExposureTime, ISO, FocalLength, FocalLengthIn35mm, Flash, ExposureBias, MeteringMode, ExposureProgram, LensModel, GPSAltitude, and Orientation

#### Scenario: Orientation field preserved
- **WHEN** a photo has an EXIF orientation tag (1-8)
- **THEN** the orientation value SHALL be stored in the photo object and applied to image display via CSS transform or image-orientation
