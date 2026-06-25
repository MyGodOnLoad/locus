var DEFAULT_PARAMS = {
  spatial: {
    clusterEps: 0.5,       // DBSCAN epsilon in km
    minClusterPts: 5       // Minimum photos for a cluster
  },
  residence: {
    minDuration: 60,       // Days — minimum span for a residence
    minPhotosPerMonth: 3   // Average photos/month threshold
  },
  excursion: {
    maxGapHours: 48,       // Merge adjacent excursions within this gap
    minPhotos: 3           // Minimum photos for an excursion
  },
  event: {
    densityThreshold: 20   // Photos/day threshold for an event
  }
};

/* ── Haversine distance in kilometres ── */
function haversineKm(lat1, lng1, lat2, lng2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ── Grid bucket index for spatial acceleration ── */
function gridIndex(photos, cellSizeKm) {
  // cellSizeKm ~ 2 * eps for optimal bucket lookup
  var grid = {};
  var cellDeg = cellSizeKm / 111.0; // approximate degrees per km
  for (var i = 0; i < photos.length; i++) {
    var cx = Math.floor(photos[i].lat / cellDeg);
    var cy = Math.floor(photos[i].lng / cellDeg);
    // Store in self + 8 neighbors for safe boundary queries
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = -1; dy <= 1; dy++) {
        var key = (cx + dx) + ',' + (cy + dy);
        if (!grid[key]) grid[key] = [];
        grid[key].push(i);
      }
    }
  }
  return { grid: grid, cellDeg: cellDeg };
}

/* ── DBSCAN clustering with grid acceleration ── */
function dbscan(photos, epsKm, minPts) {
  var n = photos.length;
  if (n === 0) return { labels: [], clusterCount: 0 };

  var labels = new Array(n).fill(-1);
  var clusterId = 0;
  var idx = gridIndex(photos, epsKm * 2);

  function regionQuery(pi) {
    var neighbors = [];
    var cx = Math.floor(photos[pi].lat / idx.cellDeg);
    var cy = Math.floor(photos[pi].lng / idx.cellDeg);
    var key = cx + ',' + cy;
    var candidates = idx.grid[key] || [];
    for (var ci = 0; ci < candidates.length; ci++) {
      var j = candidates[ci];
      if (j === pi) continue;
      var d = haversineKm(photos[pi].lat, photos[pi].lng, photos[j].lat, photos[j].lng);
      if (d <= epsKm) neighbors.push(j);
    }
    return neighbors;
  }

  for (var i = 0; i < n; i++) {
    if (labels[i] !== -1) continue;
    var neighbors = regionQuery(i);
    if (neighbors.length < minPts) {
      labels[i] = -2;
      continue;
    }
    labels[i] = clusterId;
    var visited = {};
    visited[i] = true;
    var queue = neighbors.slice();
    while (queue.length > 0) {
      var q = queue.shift();
      if (q === i) continue;
      if (labels[q] === -2) labels[q] = clusterId;
      if (labels[q] !== -1) continue;
      labels[q] = clusterId;
      var qNeighbors = regionQuery(q);
      if (qNeighbors.length >= minPts) {
        for (var k = 0; k < qNeighbors.length; k++) {
          var nb = qNeighbors[k];
          if (nb === i || nb === q) continue;
          if (labels[nb] === -1 || labels[nb] === -2) {
            if (!visited[nb]) { visited[nb] = true; queue.push(nb); }
          }
        }
      }
    }
    clusterId++;
  }

  return { labels: labels, clusterCount: clusterId };
}

/* ── Group photos by cluster IDs ── */
function clusterPhotos(photos, labels, clusterCount) {
  var clusters = [];
  for (var c = 0; c < clusterCount; c++) {
    clusters.push([]);
  }
  var noise = [];
  for (var i = 0; i < photos.length; i++) {
    if (labels[i] >= 0) {
      clusters[labels[i]].push(photos[i]);
    } else {
      noise.push(photos[i]);
    }
  }
  return { clusters: clusters, noise: noise };
}

/* ── Compute centroid of a photo set ── */
function centroid(photos) {
  if (photos.length === 0) return null;
  var sumLat = 0, sumLng = 0;
  for (var i = 0; i < photos.length; i++) {
    sumLat += photos[i].lat;
    sumLng += photos[i].lng;
  }
  return { lat: sumLat / photos.length, lng: sumLng / photos.length };
}

/* ── Sort photos by datetime ── */
function sortByTime(photos) {
  return photos.slice().sort(function (a, b) {
    var ta = a.datetime ? a.datetime.getTime() : 0;
    var tb = b.datetime ? b.datetime.getTime() : 0;
    return ta - tb;
  });
}

/* ── Main residence detection ── */
function detectResidences(photos, params) {
  if (!photos || photos.length === 0) return { residences: [], noise: [], excursions: [] };

  var geotagged = photos.filter(function (p) { return p.lat != null && p.lng != null && p.datetime != null; });
  var ungeotagged = photos.filter(function (p) { return !(p.lat != null && p.lng != null && p.datetime != null); });

  if (geotagged.length === 0) {
    return { residences: [], noise: ungeotagged, excursions: [] };
  }

  var sorted = sortByTime(geotagged);

  // DBSCAN clustering
  var dbscanResult = dbscan(sorted, params.spatial.clusterEps, params.spatial.minClusterPts);
  var grouped = clusterPhotos(sorted, dbscanResult.labels, dbscanResult.clusterCount);

  // Build residence candidates from clusters
  var candidates = [];
  for (var c = 0; c < grouped.clusters.length; c++) {
    var cluster = grouped.clusters[c];
    if (cluster.length === 0) continue;
    var sortedCluster = sortByTime(cluster);
    var firstTime = sortedCluster[0] && sortedCluster[0].datetime;
    var lastTime = sortedCluster[sortedCluster.length - 1] && sortedCluster[sortedCluster.length - 1].datetime;
    var durationDays = (lastTime.getTime() - firstTime.getTime()) / (1000 * 60 * 60 * 24);
    var monthsSpan = Math.max(1, durationDays / 30);
    var photosPerMonth = cluster.length / monthsSpan;

    if (durationDays >= params.residence.minDuration &&
        photosPerMonth >= params.residence.minPhotosPerMonth) {
      candidates.push({
        id: 'res-' + c,
        photos: sortedCluster,
        centroid: centroid(sortedCluster),
        startTime: firstTime,
        endTime: lastTime,
        durationDays: durationDays,
        clusterIndex: c
      });
    }
  }

  // Sort candidates by start time
  candidates.sort(function (a, b) { return a.startTime.getTime() - b.startTime.getTime(); });

  // Merge adjacent residences that are spatially close
  var residences = [];
  for (var i = 0; i < candidates.length; i++) {
    if (residences.length === 0) {
      residences.push(candidates[i]);
      continue;
    }
    var prev = residences[residences.length - 1];
    var dist = haversineKm(prev.centroid.lat, prev.centroid.lng,
      candidates[i].centroid.lat, candidates[i].centroid.lng);
    // If < 10 km and the gap is < 90 days, merge
    var gapDays = (candidates[i].startTime.getTime() - prev.endTime.getTime()) / (1000 * 60 * 60 * 24);
    if (dist < 10 && gapDays < 90) {
      prev.photos = sortByTime(prev.photos.concat(candidates[i].photos));
      prev.endTime = candidates[i].endTime;
      prev.durationDays = (prev.endTime.getTime() - prev.startTime.getTime()) / (1000 * 60 * 60 * 24);
      prev.centroid = centroid(prev.photos);
    } else {
      residences.push(candidates[i]);
    }
  }

  // Collect all residence photo IDs for noise classification
  var residencePhotoIds = {};
  for (var r = 0; r < residences.length; r++) {
    for (var p = 0; p < residences[r].photos.length; p++) {
      residencePhotoIds[residences[r].photos[p].id || residences[r].photos[p].path] = true;
    }
  }

  // Noise = non-residence photos + non-geotagged
  var noise = [];
  for (var j = 0; j < grouped.noise.length; j++) {
    noise.push(grouped.noise[j]);
  }
  // Also add cluster photos that didn't become residences
  for (var cl = 0; cl < grouped.clusters.length; cl++) {
    for (var cp = 0; cp < grouped.clusters[cl].length; cp++) {
      var photo = grouped.clusters[cl][cp];
      var key = photo.id || photo.path;
      if (!residencePhotoIds[key]) {
        noise.push(photo);
      }
    }
  }
  // Add ungeotagged photos
  for (var u = 0; u < ungeotagged.length; u++) {
    noise.push(ungeotagged[u]);
  }

  return { residences: residences, noise: noise };
}

/* ── Detect excursions within a residence ── */
function detectExcursions(residence, params) {
  if (!residence || !residence.photos) return [];

  var sorted = sortByTime(residence.photos.filter(function (p) { return p.lat != null && p.lng != null; }));
  if (sorted.length === 0) return [];

  var excursions = [];
  var currentExcursion = [];
  var distThreshold = params.spatial.clusterEps * 10; // ~5 km away from residence centroid

  for (var i = 0; i < sorted.length; i++) {
    var dist = haversineKm(residence.centroid.lat, residence.centroid.lng, sorted[i].lat, sorted[i].lng);
    if (dist > distThreshold) {
      currentExcursion.push(sorted[i]);
    } else {
      if (currentExcursion.length >= params.excursion.minPhotos) {
        var excursionSorted = sortByTime(currentExcursion);
        var durationHours = (excursionSorted[excursionSorted.length - 1].datetime.getTime() -
          excursionSorted[0].datetime.getTime()) / (1000 * 60 * 60);
        if (durationHours >= 4) {
          excursions.push({ photos: excursionSorted, gapBefore: i - currentExcursion.length });
        }
      }
      currentExcursion = [];
    }
  }
  // Last segment
  if (currentExcursion.length >= params.excursion.minPhotos) {
    var excursionSorted2 = sortByTime(currentExcursion);
    var durationHours2 = (excursionSorted2[excursionSorted2.length - 1].datetime.getTime() -
      excursionSorted2[0].datetime.getTime()) / (1000 * 60 * 60);
    if (durationHours2 >= 4) {
      excursions.push({ photos: excursionSorted2, gapBefore: sorted.length - currentExcursion.length });
    }
  }

  return excursions;
}

/* ── Detect migration periods between residences ── */
function detectMigrations(residences, allPhotos, params) {
  var migrations = [];
  for (var i = 0; i < residences.length - 1; i++) {
    var gapStart = residences[i].endTime;
    var gapEnd = residences[i + 1].startTime;

    var gapPhotos = allPhotos.filter(function (p) {
      return p.datetime && p.datetime >= gapStart && p.datetime <= gapEnd;
    });

    if (gapPhotos.length > 0) {
      migrations.push({
        id: 'migration-' + i,
        from: residences[i].id,
        to: residences[i + 1].id,
        photos: sortByTime(gapPhotos)
      });
    }
  }
  return migrations;
}

/* ═══════════════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════════════ */

export function detectAll(photos, customParams) {
  var params = mergeParams(customParams);
  var result = detectResidences(photos, params);

  // Detect excursions for each residence
  var allExcursions = [];
  for (var r = 0; r < result.residences.length; r++) {
    var exc = detectExcursions(result.residences[r], params);
    for (var e = 0; e < exc.length; e++) {
      exc[e].residenceId = result.residences[r].id;
      exc[e].id = result.residences[r].id + '-exc-' + e;
    }
    allExcursions.push.apply(allExcursions, exc);
  }

  // Detect migrations
  var migrations = detectMigrations(result.residences, photos, params);

  // Apply corrections if provided (placeholder — applied by store layer)
  return {
    residences: result.residences,
    excursions: allExcursions,
    migrations: migrations,
    noise: result.noise,
    params: params
  };
}

export function mergeParams(customParams) {
  if (!customParams) return JSON.parse(JSON.stringify(DEFAULT_PARAMS));
  var merged = JSON.parse(JSON.stringify(DEFAULT_PARAMS));
  if (customParams.spatial) {
    if (typeof customParams.spatial.clusterEps === 'number') merged.spatial.clusterEps = customParams.spatial.clusterEps;
    if (typeof customParams.spatial.minClusterPts === 'number') merged.spatial.minClusterPts = customParams.spatial.minClusterPts;
  }
  if (customParams.residence) {
    if (typeof customParams.residence.minDuration === 'number') merged.residence.minDuration = customParams.residence.minDuration;
    if (typeof customParams.residence.minPhotosPerMonth === 'number') merged.residence.minPhotosPerMonth = customParams.residence.minPhotosPerMonth;
  }
  if (customParams.excursion) {
    if (typeof customParams.excursion.maxGapHours === 'number') merged.excursion.maxGapHours = customParams.excursion.maxGapHours;
    if (typeof customParams.excursion.minPhotos === 'number') merged.excursion.minPhotos = customParams.excursion.minPhotos;
  }
  if (typeof customParams.event !== 'undefined' && customParams.event) {
    if (typeof customParams.event.densityThreshold === 'number') merged.event.densityThreshold = customParams.event.densityThreshold;
  }
  return merged;
}

export default { detectAll: detectAll, mergeParams: mergeParams };
