var AMAP_GEOCODE_URL = 'https://restapi.amap.com/v3/geocode/geo';

export function parseAmapLocation(location) {
  if (!location || typeof location !== 'string') return null;
  var parts = location.split(',');
  if (parts.length !== 2) return null;

  var lng = Number(parts[0]);
  var lat = Number(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lng: lng, lat: lat };
}

export function parseAmapGeocodeResponse(data) {
  if (!data || data.status !== '1' || !Array.isArray(data.geocodes) || data.geocodes.length === 0) {
    return null;
  }

  var first = data.geocodes[0];
  var point = parseAmapLocation(first.location);
  if (!point) return null;

  return {
    formattedAddress: first.formatted_address || first.address || '',
    lng: point.lng,
    lat: point.lat
  };
}

export function getStoredAmapKey() {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  return window.localStorage.getItem('locus.amapKey') || '';
}

export function saveStoredAmapKey(key) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (key) window.localStorage.setItem('locus.amapKey', key);
  else window.localStorage.removeItem('locus.amapKey');
}

export function getConfiguredAmapKey() {
  var stored = getStoredAmapKey();
  if (stored) return stored;
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AMAP_KEY) {
    return import.meta.env.VITE_AMAP_KEY;
  }
  return '';
}

export async function geocodeAddress(address, key) {
  var query = String(address || '').trim();
  var amapKey = String(key || '').trim();
  if (!query) throw new Error('请输入详细地址。');
  if (!amapKey) throw new Error('请先配置高德 Key。');

  var url = AMAP_GEOCODE_URL + '?output=json&key=' + encodeURIComponent(amapKey) + '&address=' + encodeURIComponent(query);
  var res = await fetch(url);
  if (!res.ok) throw new Error('地址解析请求失败。');

  var data = await res.json();
  var parsed = parseAmapGeocodeResponse(data);
  if (!parsed) {
    if (data && data.info && data.info !== 'OK') throw new Error('地址解析失败: ' + data.info);
    throw new Error('未找到匹配地址。');
  }
  return parsed;
}
