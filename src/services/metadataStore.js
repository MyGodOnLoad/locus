var METADATA_FILE = '.locus-metadata.json';
var dirHandle = null;
var metadata = { version: 1, photos: {} };

function parseDate(value) {
  if (!value) return null;
  var d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function setMetadataDirectory(handle) {
  dirHandle = handle || null;
}

export function getMetadata() {
  return metadata;
}

export async function loadMetadata(handle) {
  dirHandle = handle || dirHandle;
  metadata = { version: 1, photos: {} };
  if (!dirHandle) return metadata;

  try {
    var fileHandle = await dirHandle.getFileHandle(METADATA_FILE);
    var file = await fileHandle.getFile();
    var text = await file.text();
    var parsed = JSON.parse(text);
    if (parsed && parsed.photos) {
      metadata = { version: parsed.version || 1, photos: parsed.photos || {} };
    }
  } catch (e) {
    metadata = { version: 1, photos: {} };
  }
  return metadata;
}

function resetToOriginal(photo) {
  var out = Object.assign({}, photo);
  var hasOriginalDatetime = Object.prototype.hasOwnProperty.call(photo, 'originalDatetime');
  var hasOriginalLat = Object.prototype.hasOwnProperty.call(photo, 'originalLat');
  var hasOriginalLng = Object.prototype.hasOwnProperty.call(photo, 'originalLng');

  if (hasOriginalDatetime) {
    out.datetime = photo.originalDatetime != null ? new Date(photo.originalDatetime) : null;
  } else {
    out.datetime = photo.datetime || null;
  }
  out.datetimeSource = photo.originalDatetimeSource || photo.datetimeSource || 'file';

  out.lat = hasOriginalLat ? photo.originalLat : (photo.lat != null ? photo.lat : null);
  out.lng = hasOriginalLng ? photo.originalLng : (photo.lng != null ? photo.lng : null);
  out.geoSource = out.lat != null && out.lng != null ? (photo.originalGeoSource || photo.geoSource || 'exif') : null;
  delete out.manualDatetime;
  delete out.manualLat;
  delete out.manualLng;
  return out;
}

export function applyMetadataOverride(photo, overrides) {
  var out = resetToOriginal(photo);
  var item = overrides && overrides.photos ? overrides.photos[photo.path] : null;
  if (!item) return out;

  if (item.datetime) {
    var d = parseDate(item.datetime);
    if (d) {
      out.datetime = d;
      out.datetimeSource = 'manual';
      out.manualDatetime = item.datetime;
    }
  }
  if (typeof item.lat === 'number' && typeof item.lng === 'number') {
    out.lat = item.lat;
    out.lng = item.lng;
    out.geoSource = 'manual';
    out.manualLat = item.lat;
    out.manualLng = item.lng;
  }
  return out;
}

export function buildOverride(photo, values) {
  var next = Object.assign({}, metadata.photos[photo.path] || {});

  if (values.datetime) next.datetime = values.datetime;
  else delete next.datetime;

  if (typeof values.lat === 'number' && typeof values.lng === 'number') {
    next.lat = values.lat;
    next.lng = values.lng;
  } else {
    delete next.lat;
    delete next.lng;
  }

  if (!next.datetime && typeof next.lat !== 'number' && typeof next.lng !== 'number') {
    return null;
  }

  next.updatedAt = new Date().toISOString();
  return next;
}

export async function savePhotoOverride(photo, values) {
  if (!dirHandle) throw new Error('未打开可写文件夹，无法保存校准信息。');
  var override = buildOverride(photo, values);
  if (override) metadata.photos[photo.path] = override;
  else delete metadata.photos[photo.path];

  var fileHandle = await dirHandle.getFileHandle(METADATA_FILE, { create: true });
  var writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(metadata, null, 2));
  await writable.close();

  return metadata.photos[photo.path];
}

