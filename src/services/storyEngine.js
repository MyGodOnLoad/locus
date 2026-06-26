// Story engine — generates six types of story cards from photo data
// Pure function: generateStories(photos, residences, trips, events) -> StoryCard[]

export function generateStories(photos, residences, trips, events) {
  var stories = [];
  if (!photos || photos.length < 50) return stories;

  stories = stories.concat(generateDurationStories(residences, photos));
  stories = stories.concat(generateSpatialStories(trips));
  stories = stories.concat(generateDensityStories(events, photos));
  stories = stories.concat(generateContrastStories(trips));
  stories = stories.concat(generateDiscoveryStories(trips));
  stories = stories.concat(generateMilestoneStories(photos, residences, trips));

  return stories.filter(Boolean);
}

// Duration story: residence periods spanning 6+ months
function generateDurationStories(residences, photos) {
  if (!residences || residences.length === 0) return [];
  return residences
    .filter(function (r) {
      if (!r.startTime || !r.endTime) return false;
      var days = (r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60 * 60 * 24);
      return days >= 180;
    })
    .map(function (r) {
      var days = Math.round((r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60 * 60 * 24));
      var name = r.displayName || r.id || '';
      var months = Math.round(days / 30);
      return {
        type: 'duration',
        title: name,
        summary: '\u5728\u8FD9\u91CC\u5EA6\u8FC7\u4E86 ' + months + ' \u4E2A\u6708\uFF0C' + r.photoCount + ' \u5F20\u7167\u7247\u8BB0\u5F55\u4E86\u8FD9\u6BB5\u65F6\u5149\u3002',
        coverPhotoId: photos.length > 0 ? photos[0].id : null,
        targetType: 'residence',
        targetId: r.id
      };
    });
}

// Spatial story: trips covering 100+ km
function generateSpatialStories(trips) {
  if (!trips || trips.length === 0) return [];
  return trips
    .filter(function (t) { return t.totalDistance && t.totalDistance >= 100; })
    .sort(function (a, b) { return (b.totalDistance || 0) - (a.totalDistance || 0); })
    .slice(0, 3)
    .map(function (t) {
      var dist = Math.round(t.totalDistance);
      return {
        type: 'spatial',
        title: t.displayName || t.id || '',
        summary: '\u8DE8\u8D8A ' + dist + ' \u516C\u91CC\u7684\u65C5\u7A0B\uFF0C' + (t.photoCount || 0) + ' \u5F20\u7167\u7247\u6CBF\u9014\u8BB0\u5F55\u3002',
        coverPhotoId: t.coverPhotoId || null,
        targetType: 'trip',
        targetId: t.id
      };
    });
}

// Density story: days with high photo density (events)
function generateDensityStories(events, photos) {
  if (!events || events.length === 0) return [];
  return events.slice(0, 5).map(function (evt) {
    var dateStr = evt.date || (evt.dayTime ? evt.dayTime.toLocaleDateString('zh-CN') : '');
    return {
      type: 'density',
      title: evt.name || ('\u70ED\u95F9\u7684\u4E00\u5929'),
      summary: dateStr + '\uFF0C' + (evt.count || evt.photoCount || 0) + ' \u5F20\u7167\u7247\uFF0C\u6BD4\u5E73\u65F6\u70ED\u95F9\u5F97\u591A\u3002',
      coverPhotoId: evt.coverPhotoId || (photos.length > 0 ? photos[0].id : null),
      targetType: 'photo-set',
      targetId: evt.id || dateStr
    };
  });
}

// Contrast story: same location visited in different trips
function generateContrastStories(trips) {
  if (!trips || trips.length < 2) return [];
  var stories = [];
  var placeMap = {};
  // Find places visited in multiple trips
  trips.forEach(function (t) {
    if (!t.places) return;
    t.places.forEach(function (place) {
      var key = place.toLowerCase();
      if (!placeMap[key]) placeMap[key] = [];
      placeMap[key].push(t);
    });
  });
  Object.keys(placeMap).forEach(function (place) {
    var tripList = placeMap[place];
    if (tripList.length >= 2) {
      tripList.sort(function (a, b) {
        return (a.startTime ? a.startTime.getTime() : 0) - (b.startTime ? b.startTime.getTime() : 0);
      });
      var first = tripList[0];
      var last = tripList[tripList.length - 1];
      var firstDate = first.startTime ? first.startTime.toLocaleDateString('zh-CN') : '';
      var lastDate = last.startTime ? last.startTime.toLocaleDateString('zh-CN') : '';
      stories.push({
        type: 'contrast',
        title: '\u518D\u8BBF ' + place,
        summary: firstDate + ' \u548C ' + lastDate + '\uFF0C\u4E24\u6B21\u7A7F\u8D8A\u65F6\u5149\u7684\u5230\u8FBE\u3002',
        coverPhotoId: last.coverPhotoId || null,
        targetType: 'trip',
        targetId: last.id
      });
    }
  });
  return stories.slice(0, 5);
}

// Discovery story: a location that only appears once across all trips
function generateDiscoveryStories(trips) {
  if (!trips || trips.length === 0) return [];
  var stories = [];
  var placeCounts = {};
  // Count all places
  trips.forEach(function (t) {
    if (!t.places) return;
    t.places.forEach(function (place) {
      var key = place.toLowerCase();
      placeCounts[key] = (placeCounts[key] || 0) + 1;
      if (!placeCounts['_trip_' + key]) placeCounts['_trip_' + key] = t;
    });
  });
  // Find singles
  Object.keys(placeCounts).forEach(function (key) {
    if (key.indexOf('_trip_') === 0) return; // skip trip refs
    if (placeCounts[key] === 1) {
      var trip = placeCounts['_trip_' + key];
      if (trip) {
        var dateStr = trip.startTime ? trip.startTime.toLocaleDateString('zh-CN') : '';
        stories.push({
          type: 'discovery',
          title: '\u63A2\u7D22 ' + key,
          summary: dateStr + '\uFF0C\u552F\u4E00\u4E00\u6B21\u7684\u5230\u8FBE\u3002',
          coverPhotoId: trip.coverPhotoId || null,
          targetType: 'trip',
          targetId: trip.id
        });
      }
    }
  });
  return stories.slice(0, 5);
}

// Milestone story: notable transitions
function generateMilestoneStories(photos, residences, trips) {
  var stories = [];
  if (!photos || photos.length === 0) return stories;

  // Sort photos by time
  var sorted = photos.slice().sort(function (a, b) {
    return (a.datetime ? a.datetime.getTime() : 0) - (b.datetime ? b.datetime.getTime() : 0);
  });
  var first = sorted[0];
  var last = sorted[sorted.length - 1];
  var firstDate = first.datetime;
  var lastDate = last.datetime;

  if (firstDate && lastDate) {
    var spanDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    var spanYears = Math.round(spanDays / 365 * 10) / 10;
    if (spanDays > 365) {
      stories.push({
        type: 'milestone',
        title: spanYears + ' \u5E74\u7684\u65F6\u5149\u8DB3\u8FF9',
        summary: '\u4ECE ' + firstDate.toLocaleDateString('zh-CN') + ' \u5230 ' + lastDate.toLocaleDateString('zh-CN') + '\uFF0C' + photos.length + ' \u5F20\u7167\u7247\u8BB0\u5F55\u4E86\u8FD9\u6BB5\u65C5\u7A0B\u3002',
        coverPhotoId: last.id,
        targetType: 'photo-set',
        targetId: 'all'
      });
    }
  }

  // First trip milestone
  if (trips && trips.length > 0) {
    var firstTrip = trips[trips.length - 1]; // chronologically first
    if (firstTrip && firstTrip.startTime) {
      stories.push({
        type: 'milestone',
        title: '\u7B2C\u4E00\u6B21\u8FDC\u884C',
        summary: firstTrip.startTime.toLocaleDateString('zh-CN') + '\uFF0C' + (firstTrip.displayName || '') + '\u3002',
        coverPhotoId: firstTrip.coverPhotoId || null,
        targetType: 'trip',
        targetId: firstTrip.id
      });
    }
  }

  return stories;
}
