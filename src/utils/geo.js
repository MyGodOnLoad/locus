function toRad(deg) { return deg * (Math.PI / 180); }

export function haversineDistance(lat1, lng1, lat2, lng2) {
  var R = 6371;
  var dLat = toRad(lat2 - lat1);
  var dLng = toRad(lng2 - lng1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function boundsForPoints(points) {
  if (points.length === 0) return null;
  var minLat = Infinity, maxLat = -Infinity;
  var minLng = Infinity, maxLng = -Infinity;
  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  var padLat = Math.max((maxLat - minLat) * 0.1, 0.01);
  var padLng = Math.max((maxLng - minLng) * 0.1, 0.01);
  return [
    [minLat - padLat, minLng - padLng],
    [maxLat + padLat, maxLng + padLng]
  ];
}
