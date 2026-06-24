import exifr from 'exifr';

function toDecimal(dms) {
  if (typeof dms === 'number') return dms;
  if (Array.isArray(dms) && dms.length === 3) {
    return dms[0] + dms[1] / 60 + dms[2] / 3600;
  }
  return null;
}

/* Parse EXIF date: handles raw "2026:05:22 12:00:00" or ISO "2026-05-22T04:00:00.000Z" */
function parseExifDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw !== 'string') return null;
  var iso = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
  var d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export async function parseExif(arrayBuffer) {
  try {
    var data = await exifr.parse(arrayBuffer, {
      gps: true,
      tiff: true,
      exif: true,
      translateKeys: true,
      translateValues: false
    });

    if (data == null) return null;

    /* GPS: translated keys (latitude/longitude) are decimal; fallback to raw DMS */
    var lat = null, lng = null;
    if (data.latitude != null && data.longitude != null) {
      lat = toDecimal(data.latitude);
      lng = toDecimal(data.longitude);
    } else if (data.GPSLatitude != null && data.GPSLongitude != null) {
      lat = toDecimal(data.GPSLatitude);
      lng = toDecimal(data.GPSLongitude);
    }
    if (lat != null) {
      if (data.gpsLatitudeRef === 'S' || data.GPSLatitudeRef === 'S') lat = -lat;
      if (data.gpsLongitudeRef === 'W' || data.GPSLongitudeRef === 'W') lng = -lng;
    }

    /* Date: try both translated (lower) and untranslated (Capital) keys */
    var datetime = parseExifDate(data.DateTimeOriginal)
                || parseExifDate(data.dateTimeOriginal)
                || parseExifDate(data.CreateDate)
                || parseExifDate(data.createDate)
                || parseExifDate(data.ModifyDate)
                || parseExifDate(data.modifyDate)
                || null;

    return {
      lat: lat,
      lng: lng,
      datetime: datetime,
      make: data.make || data.Make || null,
      model: data.model || data.Model || null,
      width: data.imageWidth || data.ImageWidth || null,
      height: data.imageHeight || data.ImageHeight || null,
      orientation: data.orientation || data.Orientation || 1
    };
  } catch (e) {
    return null;
  }
}
