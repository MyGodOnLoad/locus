var AMAP_REGEO_URL = 'https://restapi.amap.com/v3/geocode/regeo';
var CACHE_KEY_PREFIX = 'locus.rgc.';
var REQUEST_DELAY_MS = 200;

/* ── Round coordinate for cache key (4 decimal places, ~11m) ── */
function cacheKey(lat, lng) {
  return CACHE_KEY_PREFIX + lat.toFixed(4) + ',' + lng.toFixed(4);
}

/* ── Get cached result for a coordinate ── */
function getCached(lat, lng) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  var raw = window.localStorage.getItem(cacheKey(lat, lng));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

/* ── Cache a result ── */
function setCached(lat, lng, result) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(cacheKey(lat, lng), JSON.stringify(result));
  } catch (e) {
    // localStorage full — ignore
  }
}

/* ── Parse Amap regeo response ── */
function parseRegeo(data) {
  if (!data || data.status !== '1' || !data.regeocode) return null;
  var rgc = data.regeocode;
  var ac = rgc.addressComponent || {};
  return {
    formatted: rgc.formatted_address || '',
    city: ac.city || ac.province || '',
    district: ac.district || '',
    township: ac.township || '',
    province: ac.province || ''
  };
}

/* ── Fetch one coordinate from Amap ── */
function delay(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

async function fetchOne(lat, lng, key) {
  var url = AMAP_REGEO_URL + '?output=json&location=' +
    encodeURIComponent(lng + ',' + lat) +
    '&key=' + encodeURIComponent(key) +
    '&radius=1000&extensions=base';

  try {
    var res = await fetch(url);
    if (!res.ok) return null;
    var data = await res.json();
    return parseRegeo(data);
  } catch (e) {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Batch reverse geocode a list of coordinates.
 * Returns results in the same order as input.
 * @param {Array<{lat: number, lng: number}>} coords
 * @param {string} apiKey - Amap API key
 * @returns {Promise<Array<{formatted: string, city: string, district: string, province: string} | null>>}
 */
export async function batchReverseGeocode(coords, apiKey) {
  if (!coords || coords.length === 0) return [];
  if (!apiKey) {
    // No API key — return coordinate strings as fallback
    return coords.map(function (c) {
      return { formatted: c.lat.toFixed(4) + ', ' + c.lng.toFixed(4), city: '', district: '', province: '' };
    });
  }

  var results = new Array(coords.length);
  var toFetch = [];

  // Check cache first
  for (var i = 0; i < coords.length; i++) {
    var cached = getCached(coords[i].lat, coords[i].lng);
    if (cached) {
      results[i] = cached;
    } else {
      toFetch.push({ index: i, lat: coords[i].lat, lng: coords[i].lng });
    }
  }

  // Fetch uncached coordinates with delay
  for (var j = 0; j < toFetch.length; j++) {
    if (j > 0) await delay(REQUEST_DELAY_MS);
    var item = toFetch[j];
    var fetched = await fetchOne(item.lat, item.lng, apiKey);
    if (fetched) {
      results[item.index] = fetched;
      setCached(item.lat, item.lng, fetched);
    } else {
      // Fallback to coordinates
      var fallback = { formatted: item.lat.toFixed(4) + ', ' + item.lng.toFixed(4), city: '', district: '', province: '' };
      results[item.index] = fallback;
    }
  }

  return results;
}

/**
 * Get a place summary for display (e.g., "Beijing, Haidian").
 */
export function placeSummary(result) {
  if (!result) return '';
  var parts = [];
  if (result.city) parts.push(result.city);
  if (result.district) parts.push(result.district);
  return parts.join(', ') || result.formatted || '';
}

/**
 * Build a trip place label from start and end results.
 */
export function tripPlaceLabel(startResult, endResult) {
  var start = placeSummary(startResult) || (startResult && startResult.formatted) || '';
  var end = placeSummary(endResult) || (endResult && endResult.formatted) || '';
  if (start && end && start !== end) return start + ' \u2192 ' + end;
  if (start) return start;
  if (end) return end;
  return '';
}

export default { batchReverseGeocode: batchReverseGeocode, placeSummary: placeSummary, tripPlaceLabel: tripPlaceLabel };
