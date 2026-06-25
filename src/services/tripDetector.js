var DEFAULT_PARAMS = {
  maxGapHours: 48,
  minPhotos: 3
};

/* ── Merge excursions that are close in time ── */
function mergeExcursions(excursions, maxGapHours) {
  if (!excursions || excursions.length === 0) return [];

  var sorted = excursions.slice().sort(function (a, b) {
    var ta = a.photos[0].datetime ? a.photos[0].datetime.getTime() : 0;
    var tb = b.photos[0].datetime ? b.photos[0].datetime.getTime() : 0;
    return ta - tb;
  });

  var merged = [];
  var current = {
    excursions: [sorted[0]],
    photos: sorted[0].photos.slice(),
    residenceId: sorted[0].residenceId
  };

  for (var i = 1; i < sorted.length; i++) {
    var prevLast = current.photos[current.photos.length - 1];
    var nextFirst = sorted[i].photos[0];

    var prevTime = prevLast.datetime ? prevLast.datetime.getTime() : 0;
    var nextTime = nextFirst.datetime ? nextFirst.datetime.getTime() : 0;
    var gapHours = (nextTime - prevTime) / (1000 * 60 * 60);

    // Same residence and gap within threshold — merge
    if (sorted[i].residenceId === current.residenceId && gapHours <= maxGapHours) {
      current.excursions.push(sorted[i]);
      current.photos = current.photos.concat(sorted[i].photos);
    } else {
      merged.push(current);
      current = {
        excursions: [sorted[i]],
        photos: sorted[i].photos.slice(),
        residenceId: sorted[i].residenceId
      };
    }
  }
  merged.push(current);

  return merged;
}

/* ── Sort photos chronologically and remove duplicate coords ── */
function sortByTime(photos) {
  return photos.slice().sort(function (a, b) {
    var ta = a.datetime ? a.datetime.getTime() : 0;
    var tb = b.datetime ? b.datetime.getTime() : 0;
    return ta - tb;
  });
}

function uniqueCoords(photos) {
  var seen = {};
  var result = [];
  for (var i = 0; i < photos.length; i++) {
    var key = photos[i].lat.toFixed(6) + ',' + photos[i].lng.toFixed(6);
    if (!seen[key]) {
      seen[key] = true;
      result.push({ lat: photos[i].lat, lng: photos[i].lng });
    }
  }
  return result;
}

/* ── Bounding box ── */
function boundingBox(coords) {
  var minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (var i = 0; i < coords.length; i++) {
    if (coords[i].lat < minLat) minLat = coords[i].lat;
    if (coords[i].lat > maxLat) maxLat = coords[i].lat;
    if (coords[i].lng < minLng) minLng = coords[i].lng;
    if (coords[i].lng > maxLng) maxLng = coords[i].lng;
  }
  return {
    north: maxLat, south: minLat,
    east: maxLng, west: minLng,
    center: { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
  };
}

/* ═══════════════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════════════ */

export function detectTrips(excursions, customParams) {
  var maxGap = (customParams && customParams.maxGapHours != null ? customParams.maxGapHours :
    (customParams && customParams.excursion && customParams.excursion.maxGapHours != null ?
      customParams.excursion.maxGapHours : DEFAULT_PARAMS.maxGapHours));
  var minPhotos = (customParams && customParams.minPhotos != null ? customParams.minPhotos :
    (customParams && customParams.excursion && customParams.excursion.minPhotos != null ?
      customParams.excursion.minPhotos : DEFAULT_PARAMS.minPhotos));

  var merged = mergeExcursions(excursions, maxGap);

  var trips = [];
  for (var i = 0; i < merged.length; i++) {
    var m = merged[i];
    var sorted = sortByTime(m.photos);

    if (sorted.length < minPhotos) continue;

    var path = uniqueCoords(sorted);
    var bbox = boundingBox(path);

    // Cover photo: chronologically middle
    var coverIdx = Math.floor(sorted.length / 2);
    var cover = sorted[coverIdx];

    trips.push({
      id: 'trip-' + i,
      residenceId: m.residenceId,
      photos: sorted,
      startTime: sorted[0].datetime,
      endTime: sorted[sorted.length - 1].datetime,
      photoCount: sorted.length,
      path: path,
      boundingBox: bbox,
      coverPhoto: cover,
      coverPhotoId: cover.id || cover.path
    });
  }

  // Sort by start time descending (most recent first)
  trips.sort(function (a, b) {
    return b.startTime.getTime() - a.startTime.getTime();
  });

  return trips;
}

export default { detectTrips: detectTrips };
