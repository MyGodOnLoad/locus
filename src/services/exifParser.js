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
      xmp: true,
      translateKeys: false,
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
      make: data.Make || data.make || null,
      model: data.Model || data.model || null,
      width: data.ImageWidth || data.imageWidth || null,
      height: data.ImageHeight || data.imageHeight || null,
      orientation: data.Orientation || data.orientation || 1,
      aperture: data.FNumber || data.fNumber || data.ApertureValue || data.aperture || null,
      shutterSpeed: data.ExposureTime || data.exposureTime || data.ShutterSpeedValue || data.shutterSpeed || null,
      iso: data.ISO || data.iso || null,
      focalLength: data.FocalLength || data.focalLength || null,
      focalLength35mm: data.FocalLengthIn35mm || data.FocalLengthIn35mmFilm || data.focalLength35mm || null,
      flash: data.Flash || data.flash || null,
      exposureBias: data.ExposureCompensation || data.ExposureBiasValue || data.exposureCompensation || null,
      meteringMode: data.MeteringMode || data.meteringMode || null,
      exposureProgram: data.ExposureProgram || data.exposureProgram || null,
      lensModel: data.LensModel || data.LensID || data.lensModel || null,
      altitude: data.GPSAltitude || data.gpsAltitude || null
    };
  } catch (e) {
    return null;
  }
}
