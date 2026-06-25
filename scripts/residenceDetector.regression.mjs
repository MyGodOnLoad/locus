// residenceDetector.regression.mjs
import { detectAll } from '../src/services/residenceDetector.js';

var passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log('  PASS: ' + msg); } else { failed++; console.error('  FAIL: ' + msg); } }
function makePhoto(id, lat, lng, iso) { return { id, path: '/p/'+id+'.jpg', name: id+'.jpg', lat, lng, datetime: new Date(iso), thumbnailUrl: '' }; }

// Build valid monthly date strings
function ym(m) {
  var y = 2024 + Math.floor((m - 1) / 12);
  var mo = ((m - 1) % 12) + 1;
  return y + '-' + String(mo).padStart(2, '0');
}

// Test 1: Single residence
console.log('\n=== Test 1: Single residence ===');
var p1 = [];
for (var m=1; m<=12; m++) {
  var yms = ym(m);
  for (var d=1; d<=5; d++) p1.push(makePhoto('s1-'+m+'-'+d, 39.100, 117.200, yms+'-'+String(d*6).padStart(2,'0')+'T12:00:00'));
}
var r1 = detectAll(p1);
assert(r1.residences.length===1, 'Single cluster yields 1 residence ('+r1.residences.length+' found)');

// Test 2: Two separated residences
console.log('\n=== Test 2: Two residences');
var p2 = [];
for (var m=1; m<=12; m++) {
  var yms = ym(m);
  for (var d=1; d<=5; d++) p2.push(makePhoto('rA-'+m+'-'+d, 39.100, 117.200, yms+'-'+String(d*6).padStart(2,'0')+'T12:00:00'));
}
// Beijing: months 13-23 (7 months gap, then 11 months in Beijing)
for (var m=20; m<=30; m++) {
  var yms = ym(m);
  for (var d=1; d<=5; d++) p2.push(makePhoto('rB-'+m+'-'+d, 39.900, 116.400, yms+'-'+String(d*6).padStart(2,'0')+'T12:00:00'));
}
var r2 = detectAll(p2);
assert(r2.residences.length===2, 'Two clusters yield 2 residences ('+r2.residences.length+' found');

// Test 3: Short stay
console.log('\n=== Test 3: Short stay');
var p3 = [];
for (var d=1; d<=6; d++) p3.push(makePhoto('s'+d, 34.000, 108.000, '2024-01-'+String(d*2).padStart(2,'0')+'T12:00:00'));
var r3 = detectAll(p3);
assert(r3.residences.length===0, 'Short stay yields 0');

// Test 4: Empty
console.log('\n=== Test 4: Empty');
var r4 = detectAll([]);
assert(r4.residences.length===0, 'Empty yields 0');

// Test 5: No geotag
console.log('\n=== Test 5: No geotag');
var p5 = [makePhoto('ng', null, null, '2024-06-15T12:00:00')];
var r5 = detectAll(p5);
assert(r5.residences.length===0, 'No geotag yields 0');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed>0) process.exit(1);
