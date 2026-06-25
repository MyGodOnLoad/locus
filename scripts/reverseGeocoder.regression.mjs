// reverseGeocoder.regression.mjs
import { batchReverseGeocode, placeSummary, tripPlaceLabel } from '../src/services/reverseGeocoder.js';

var passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log('  PASS: ' + msg); } else { failed++; console.error('  FAIL: ' + msg); } }

// Test 1: Empty input
console.log('\n=== Test 1: Empty input ===');
var r1 = await batchReverseGeocode([], 'test-key');
assert(r1.length===0, 'Empty returns empty array');

// Test 2: No API key — fallback to coordinates
console.log('\n=== Test 2: No API key ===');
var r2 = await batchReverseGeocode([{lat:39.9042, lng:116.4074}], '');
assert(r2.length===1, 'Returns 1 result');
assert(r2[0].formatted.includes('39.9042'), 'Fallback contains lat');
assert(r2[0].formatted.includes('116.4074'), 'Fallback contains lng');

// Test 3: placeSummary
console.log('\n=== Test 3: placeSummary ===');
var s1 = placeSummary({city:'Beijing', district:'Haidian'});
assert(s1==='Beijing, Haidian', 'City+District: '+s1);
var s2 = placeSummary({city:'Beijing'});
assert(s2==='Beijing', 'City only: '+s2);
var s3 = placeSummary(null);
assert(s3==='', 'Null returns empty');

// Test 4: tripPlaceLabel
console.log('\n=== Test 4: tripPlaceLabel ===');
var l1 = tripPlaceLabel({formatted:'Beijing'}, {formatted:'Shanghai'});
assert(l1==='Beijing → Shanghai', 'Different cities');

var l2 = tripPlaceLabel({formatted:'Beijing'}, {formatted:'Beijing'});
assert(l2==='Beijing', 'Same city returns one');

var l3 = tripPlaceLabel(null, null);
assert(l3==='', 'Both null returns empty');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed>0) process.exit(1);
