// Trip exporter — generates HTML trip diary and GPX files

// Helper: convert blob URL to base64 data URI
function blobToDataUrl(blobUrl) {
  return fetch(blobUrl)
    .then(function (r) { return r.blob(); })
    .then(function (blob) {
      return new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onloadend = function () { resolve(reader.result); };
        reader.readAsDataURL(blob);
      });
    });
}

// Generate a self-contained HTML trip diary
export async function exportHtmlDiary(trip, placeNames) {
  var photos = trip.photos || [];
  var path = trip.path || [];
  var name = trip.displayName || trip.id || '旅行日记';
  var startStr = trip.startTime ? trip.startTime.toLocaleDateString('zh-CN') : '';
  var endStr = trip.endTime ? trip.endTime.toLocaleDateString('zh-CN') : '';

  // Group photos by day
  var dayGroups = {};
  photos.forEach(function (p) {
    if (!p.datetime) return;
    var key = p.datetime.toLocaleDateString('zh-CN');
    if (!dayGroups[key]) dayGroups[key] = [];
    dayGroups[key].push(p);
  });

  // Convert up to 200 thumbnails to base64
  var photoLimit = 200;
  var thumbnails = {};
  var photoSlice = photos.slice(0, photoLimit);
  for (var i = 0; i < photoSlice.length; i++) {
    try {
      thumbnails[photoSlice[i].id] = await blobToDataUrl(photoSlice[i].thumbnailUrl);
    } catch (e) {
      thumbnails[photoSlice[i].id] = '';
    }
  }

  // Build path JSON for Leaflet
  var pathJson = JSON.stringify(path.map(function (w) { return [w.lat, w.lng]; }));
  var centerLat = path.length > 0 ? path[Math.floor(path.length / 2)].lat : 35;
  var centerLng = path.length > 0 ? path[Math.floor(path.length / 2)].lng : 105;

  var daysHtml = '';
  var dayKeys = Object.keys(dayGroups).sort();
  dayKeys.forEach(function (dayKey) {
    var dayPhotos = dayGroups[dayKey];
    daysHtml += '<div class="day-group"><h3>' + dayKey + '</h3><div class="day-photos">';
    dayPhotos.forEach(function (p) {
      var thumb = thumbnails[p.id] || '';
      if (thumb) {
        daysHtml += '<div class="day-photo"><img src="' + thumb + '" alt="' + (p.name || '') + '" /><div class="day-photo-name">' + (p.name || '') + '</div></div>';
      }
    });
    daysHtml += '</div></div>';
  });

  var html = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + name + '</title>\n'
    + '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />\n'
    + '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></' + 'script>\n'
    + '<style>\n'
    + 'body{font-family:system-ui,sans-serif;margin:0;padding:0;background:#1a1a2e;color:#e0e0e0;}\n'
    + '.header{padding:24px 32px 16px;text-align:center;}\n'
    + '.header h1{margin:0;font-size:24px;}\n'
    + '.header .meta{font-size:14px;color:#888;margin-top:4px;}\n'
    + '#map{width:100%;height:400px;}\n'
    + '.photos{padding:16px 32px;max-width:960px;margin:0 auto;}\n'
    + '.day-group{margin-bottom:24px;}\n'
    + '.day-group h3{font-size:16px;color:#aaa;border-bottom:1px solid #333;padding-bottom:4px;}\n'
    + '.day-photos{display:flex;flex-wrap:wrap;gap:8px;}\n'
    + '.day-photo{width:160px;}\n'
    + '.day-photo img{width:100%;height:auto;border-radius:4px;}\n'
    + '.day-photo-name{font-size:11px;color:#888;margin-top:2px;word-break:break-all;}\n'
    + '</style>\n</head>\n<body>\n'
    + '<div class="header"><h1>' + name + '</h1><div class="meta">' + startStr + ' → ' + endStr + ' · ' + photos.length + ' 张照片</div></div>\n'
    + '<div id="map"></div>\n'
    + '<div class="photos">' + daysHtml + '</div>\n'
    + '<script>\n'
    + 'var map=L.map("map").setView([' + centerLat + ',' + centerLng + '],10);\n'
    + 'L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap",maxZoom:18}).addTo(map);\n'
    + 'var path=' + pathJson + ';\n'
    + 'if(path.length>1){var line=L.polyline(path,{color:"#3b82f6",weight:3,opacity:0.8}).addTo(map);map.fitBounds(line.getBounds(),{padding:[20,20]});}\n'
    + '<\/' + 'script>\n</body>\n</html>';

  return html;
}

// Generate GPX 1.1 file from trip waypoints
export function exportGpx(trip) {
  var photos = trip.photos || [];
  var name = trip.displayName || trip.id || 'Unnamed Trip';
  var startStr = trip.startTime ? trip.startTime.toISOString() : '';
  var endStr = trip.endTime ? trip.endTime.toISOString() : '';

  // Filter photos with GPS
  var waypoints = photos.filter(function (p) {
    return p.lat != null && p.lng != null;
  });

  if (waypoints.length === 0) return null;

  var gpx = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<gpx version="1.1" creator="时光机" xmlns="http://www.topografix.com/GPX/1/1">\n'
    + '  <metadata>\n'
    + '    <name>' + escapeXml(name) + '</name>\n'
    + '    <desc>' + startStr + ' → ' + endStr + ' (' + waypoints.length + ' waypoints)</desc>\n'
    + '  </metadata>\n';

  waypoints.forEach(function (p) {
    gpx += '  <wpt lat="' + p.lat + '" lon="' + p.lng + '">\n';
    if (p.altitude != null) gpx += '    <ele>' + p.altitude + '</ele>\n';
    if (p.datetime) gpx += '    <time>' + p.datetime.toISOString() + '</time>\n';
    gpx += '    <name>' + escapeXml(p.name || '') + '</name>\n';
    gpx += '  </wpt>\n';
  });

  gpx += '</gpx>\n';
  return gpx;
}

function escapeXml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
