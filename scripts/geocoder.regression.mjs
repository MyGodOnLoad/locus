import assert from 'node:assert/strict';
import { parseAmapGeocodeResponse, parseAmapLocation } from '../src/services/geocoder.js';

assert.deepEqual(parseAmapLocation('117.054999,39.056000'), {
  lng: 117.054999,
  lat: 39.056
});

assert.equal(parseAmapLocation('bad-data'), null);
assert.equal(parseAmapLocation('181,39'), null);
assert.equal(parseAmapLocation('117,91'), null);

var parsed = parseAmapGeocodeResponse({
  status: '1',
  count: '1',
  geocodes: [{
    formatted_address: '天津市西青区天津南站',
    location: '117.054999,39.056000'
  }]
});

assert.deepEqual(parsed, {
  formattedAddress: '天津市西青区天津南站',
  lng: 117.054999,
  lat: 39.056
});

assert.equal(parseAmapGeocodeResponse({ status: '1', count: '0', geocodes: [] }), null);

console.log('geocoder regression tests passed');
