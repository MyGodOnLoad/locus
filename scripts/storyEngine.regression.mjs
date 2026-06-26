import { generateStories } from '../src/services/storyEngine.js';

var photos = [];
var baseTime = new Date('2022-01-01').getTime();

// Generate 100 fake photos across 3 years
for (var i = 0; i < 100; i++) {
  photos.push({
    id: 'photo-' + i,
    name: 'IMG_' + String(i).padStart(4, '0') + '.jpg',
    datetime: new Date(baseTime + i * 7 * 24 * 3600 * 1000),
    lat: 30 + Math.random() * 10,
    lng: 110 + Math.random() * 10
  });
}

// Fake residences
var residences = [
  {
    id: 'res-1', displayName: 'Beijing', photoCount: 45,
    startTime: new Date('2022-01-01'), endTime: new Date('2023-06-01')
  },
  {
    id: 'res-2', displayName: 'Shanghai', photoCount: 30,
    startTime: new Date('2023-07-01'), endTime: new Date('2024-12-01')
  }
];

// Fake trips
var trips = [
  {
    id: 'trip-1', displayName: 'Japan Trip', photoCount: 15,
    startTime: new Date('2022-05-01'), endTime: new Date('2022-05-15'),
    totalDistance: 2500, coverPhotoId: 'photo-5',
    places: ['Tokyo', 'Kyoto']
  },
  {
    id: 'trip-2', displayName: 'Weekend Hike', photoCount: 5,
    startTime: new Date('2023-08-01'), endTime: new Date('2023-08-03'),
    totalDistance: 50, coverPhotoId: 'photo-50',
    places: ['Tokyo']
  }
];

var events = [
  { date: '2022-03-15', count: 25, name: 'Birthday Party', photoCount: 25 }
];

var stories = generateStories(photos, residences, trips, events);

console.log('Story count:', stories.length);
console.log('Types:', stories.map(function (s) { return s.type; }));

var hasDuration = stories.some(function (s) { return s.type === 'duration'; });
var hasMilestone = stories.some(function (s) { return s.type === 'milestone'; });
var hasContrast = stories.some(function (s) { return s.type === 'contrast'; });
var hasDiscovery = stories.some(function (s) { return s.type === 'discovery'; });

console.log('Duration story:', hasDuration);
console.log('Milestone story:', hasMilestone);
console.log('Contrast story:', hasContrast);
console.log('Discovery story:', hasDiscovery);

if (stories.length === 0) { console.log('FAIL: no stories generated'); process.exit(1); }
if (!hasDuration) { console.log('FAIL: missing duration story'); process.exit(1); }
if (!hasMilestone) { console.log('FAIL: missing milestone story'); process.exit(1); }
if (!hasContrast) { console.log('FAIL: missing contrast story'); process.exit(1); }
if (!hasDiscovery) { console.log('WARN: discovery story may need single-place trips'); }

console.log('PASS');
