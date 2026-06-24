import assert from 'node:assert/strict';
import { applyMetadataOverride } from '../src/services/metadataStore.js';

var photo = {
  id: 'p1',
  name: 'geo.jpg',
  path: 'geo.jpg',
  datetime: new Date('2026-05-22T04:00:00.000Z'),
  datetimeSource: 'exif',
  lat: 39.056,
  lng: 117.055
};

var updated = applyMetadataOverride(photo, { version: 1, photos: {} });

assert.equal(updated.lat, 39.056, 'GPS latitude should survive when no override exists');
assert.equal(updated.lng, 117.055, 'GPS longitude should survive when no override exists');
assert.equal(updated.datetimeSource, 'exif', 'EXIF datetime source should survive when no override exists');

console.log('metadataStore regression tests passed');
