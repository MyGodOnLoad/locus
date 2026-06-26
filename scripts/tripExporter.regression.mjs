import { exportGpx } from '../src/services/tripExporter.js';

var trip = {
  id: 'test-trip',
  displayName: 'Test Adventure',
  startTime: new Date('2024-03-15T08:00:00Z'),
  endTime: new Date('2024-03-15T18:00:00Z'),
  photos: [
    { name: 'IMG_001.jpg', lat: 30.251, lng: 120.161, altitude: 128, datetime: new Date('2024-03-15T08:30:00Z') },
    { name: 'IMG_002.jpg', lat: 30.252, lng: 120.162, altitude: null, datetime: null },
    { name: 'IMG_003.jpg', lat: null, lng: null }, // no GPS, should be excluded
    { name: 'IMG_004.jpg', lat: 30.253, lng: 120.163, altitude: 130, datetime: new Date('2024-03-15T09:00:00Z') }
  ]
};

var gpx = exportGpx(trip);

if (!gpx) { console.log('FAIL: gpx is null'); process.exit(1); }
if (gpx.indexOf('<gpx') < 0) { console.log('FAIL: missing gpx root'); process.exit(1); }
if (gpx.indexOf('<wpt') < 0) { console.log('FAIL: missing waypoints'); process.exit(1); }
if (gpx.indexOf('Test Adventure') < 0) { console.log('FAIL: missing trip name'); process.exit(1); }
if (gpx.indexOf('IMG_003') >= 0) { console.log('FAIL: included photo without GPS'); process.exit(1); }

// Count waypoints
var wptCount = (gpx.match(/<wpt/g) || []).length;
if (wptCount !== 3) { console.log('FAIL: expected 3 waypoints, got ' + wptCount); process.exit(1); }

// Test trip with no GPS photos
var noGpsTrip = { id: 'no-gps', photos: [{ name: 'no-gps.jpg', lat: null, lng: null }] };
var noGpsResult = exportGpx(noGpsTrip);
if (noGpsResult !== null) { console.log('FAIL: should return null for no-GPS trip'); process.exit(1); }

console.log('PASS: GPX export works correctly');
