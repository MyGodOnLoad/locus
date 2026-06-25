/* ═══════════════════════════════════════════════════════════
   Amap API key configuration — shared by geocoder and reverseGeocoder
   ═══════════════════════════════════════════════════════════ */

var STORAGE_KEY = 'locus.amapKey';

export function getStoredAmapKey() {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  return window.localStorage.getItem(STORAGE_KEY) || '';
}

export function saveStoredAmapKey(key) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (key) window.localStorage.setItem(STORAGE_KEY, key);
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function getConfiguredAmapKey() {
  var stored = getStoredAmapKey();
  if (stored) return stored;
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AMAP_KEY) {
    return import.meta.env.VITE_AMAP_KEY;
  }
  return '';
}
