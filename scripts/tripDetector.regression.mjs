// tripDetector.regression.mjs
import { detectTrips } from '../src/services/tripDetector.js';

var passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log('  PASS: ' + msg); } else { failed++; console.error('  FAIL: ' + msg); } }

function makePhoto(id, lat, lng, iso) { return { id, path: '/p/'+id+'.jpg', name: id+'.jpg', lat, lng, datetime: new Date(iso), thumbnailUrl: '' }; }

// Test 1: Single trip from excursions
console.log('\n=== Test 1: Single trip ===');
var exc1 = [{
  id: 'exc-0', residenceId: 'res-0',
  photos: [
    makePhoto('t0', 38.2, 117.8, '2024-06-15T09:00:00'),
    makePhoto('t1', 38.2, 117.8, '2024-06-15T11:00:00'),
    makePhoto('t2', 38.3, 117.9, '2024-06-15T14:00:00'),
  ]
}];
var trips1 = detectTrips(exc1);
assert(trips1.length===1, 'Single excursion yields 1 trip ('+trips1.length+' found)');
assert(trips1[0].photoCount===3, 'Trip has 3 photos');
assert(trips1[0].path.length===2, 'Trajectory has 2 unique coords');

// Test 2: Merge adjacent excursions
console.log('\n=== Test 2: Merge adjacent excursions ===');
var exc2 = [
  { id: 'exc-0', residenceId: 'res-0', photos: [ makePhoto('a0', 38.2, 117.8, '2024-06-15T09:00:00'), makePhoto('a1', 38.2, 117.8, '2024-06-15T11:00:00'), makePhoto('a2', 38.3, 117.9, '2024-06-15T14:00:00') ] },
  { id: 'exc-1', residenceId: 'res-0', photos: [ makePhoto('b0', 38.2, 117.8, '2024-06-16T09:00:00'), makePhoto('b1', 38.3, 117.9, '2024-06-16T13:00:00'), makePhoto('b2', 38.2, 117.8, '2024-06-16T17:00:00') ] },
];
var trips2 = detectTrips(exc2);
assert(trips2.length===1, 'Adjacent excursions merged into 1 trip ('+trips2.length+' found)');
assert(trips2[0].photoCount===6, 'Merged trip has 6 photos');

// Test 3: Cover photo
console.log('\n=== Test 3: Cover photo selection ===');
var exc3 = [{
  id: 'exc-0', residenceId: 'res-0',
  photos: [
    makePhoto('c0', 38.2, 117.8, '2024-06-15T09:00:00'),
    makePhoto('c1', 38.2, 117.8, '2024-06-15T10:00:00'),
    makePhoto('c2', 38.3, 117.9, '2024-06-15T11:00:00'),
    makePhoto('c3', 38.2, 117.8, '2024-06-15T12:00:00'),
    makePhoto('c4', 38.3, 117.9, '2024-06-15T13:00:00'),
  ]
}];
var trips3 = detectTrips(exc3);
assert(trips3[0].coverPhoto.id==='c2', 'Cover photo is middle (index 2)');

// Test 4: Empty excursions
console.log('\n=== Test 4: Empty excursions ===');
var trips4 = detectTrips([]);
assert(trips4.length===0, 'Empty yields 0 trips');

// Test 5: Bounding box
console.log('\n=== Test 5: Bounding box ===');
var exc5 = [{
  id: 'exc-0', residenceId: 'res-0',
  photos: [
    makePhoto('d0', 38.0, 117.0, '2024-06-15T09:00:00'),
    makePhoto('d1', 39.0, 118.0, '2024-06-15T10:00:00'),
    makePhoto('d2', 37.0, 116.5, '2024-06-15T11:00:00'),
  ]
}];
var trips5 = detectTrips(exc5);
assert(trips5[0].boundingBox.north===39.0, 'North bound correct');
assert(trips5[0].boundingBox.south===37.0, 'South bound correct');
assert(trips5[0].boundingBox.east===118.0, 'East bound correct');
assert(trips5[0].boundingBox.west===116.5, 'West bound correct');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed>0) process.exit(1);
