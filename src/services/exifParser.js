import exifr from 'exifr';

function toDecimal(dms) {
  if (typeof dms === 'number') return dms;
  if (Array.isArray(dms) && dms.length === 3) {
    return dms[0] + dms[1] / 60 + dms[2] / 3600;
  }
  return null;
}

function parseExifDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw !== 'string') return null;
  var iso = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '--');
  var d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function toFractionString(val) {
  if (val == null) return null;
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val) && val.length === 2 && val[1] !== 0) {
    return String(val[0] / val[1]);
  }
  return String(val);
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

    var lat = null, lng = null;
    if (data.latitude != null && data.longitude != null) {
      lat = toDecimal(data.latitude); lng = toDecimal(data.longitude);
    } else if (data.GPSLatitude != null && data.GPSLongitude != null) {
      lat = toDecimal(data.GPSLatitude); lng = toDecimal(data.GPSLongitude);
    }
    if (lat != null) {
      if (data.gpsLatitudeRef === 'S' || data.GPSLatitudeRef === 'S') lat = -lat;
      if (data.gpsLongitudeRef === 'W' || data.GPSLongitudeRef === 'W') lng = -lng;
    }

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
      orientation: data.orientation || data.Orientation || 1,
      aperture: data.fNumber || data.FNumber || data.aperture || data.ApertureValue || null,
      shutterSpeed: data.exposureTime || data.ExposureTime || data.shutterSpeed || data.ShutterSpeedValue || null,
      iso: data.iso || data.ISO || null,
      focalLength: data.focalLength || data.FocalLength || null,
      flash: data.flash || data.Flash || null,
      altitude: data.gpsAltitude || data.GPSAltitude || null
    };
  } catch (e) {
    return null;
  }
}
