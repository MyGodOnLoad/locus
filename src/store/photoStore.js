import { create } from "zustand";
import { detectAll } from "../services/residenceDetector.js";
import { detectTrips } from "../services/tripDetector.js";

var DEFAULT_PARAMS = {
  spatial: { clusterEps: 0.5, minClusterPts: 5 },
  residence: { minDuration: 60, minPhotosPerMonth: 3 },
  excursion: { maxGapHours: 48, minPhotos: 3 },
  event: { densityThreshold: 20 }
};

function loadParams() {
  if (typeof window === 'undefined' || !window.localStorage) return JSON.parse(JSON.stringify(DEFAULT_PARAMS));
  try {
    var raw = window.localStorage.getItem('locus.detectionParams');
    if (raw) {
      var parsed = JSON.parse(raw);
      return {
        spatial: Object.assign({}, DEFAULT_PARAMS.spatial, parsed.spatial || {}),
        residence: Object.assign({}, DEFAULT_PARAMS.residence, parsed.residence || {}),
        excursion: Object.assign({}, DEFAULT_PARAMS.excursion, parsed.excursion || {}),
        event: Object.assign({}, DEFAULT_PARAMS.event, parsed.event || {})
      };
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_PARAMS));
}

function saveParams(params) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try { window.localStorage.setItem('locus.detectionParams', JSON.stringify(params)); } catch (e) {}
}

// Memoization helper — returns cached value if keys unchanged
function memo(fn) {
  var lastKey = null;
  var lastValue = null;
  return function () {
    var args = Array.prototype.slice.call(arguments);
    var key = JSON.stringify(args);
    if (key === lastKey) return lastValue;
    lastKey = key;
    lastValue = fn.apply(null, args);
    return lastValue;
  };
}

export var usePhotoStore = create(function (set, get) {
  var _residenceCacheKey = '';
  var _residenceCache = null;
  var _tripCacheKey = '';
  var _tripCache = null;

  return {
    photos: [],
    loading: false,
    error: null,
    viewMode: "lifemap",
    mapBoundsFilter: null,
    timeFilter: null,
    selectedIndex: -1,
    selectedTripId: null,
    theme: "ink",
    detecting: false,
    locusMetadata: { version: 1, residenceOverrides: {}, tripOverrides: {}, heartedPhotos: [] },
    detectionParams: loadParams(),
    placeNames: {},

    setPhotos: function (photos) { set({ photos: photos, loading: false, error: null }); },
    setLoading: function (loading) { set({ loading: loading }); },
    setError: function (error) { set({ error: error, loading: false }); },
    addPhotos: function (newPhotos) { set(function (state) { return { photos: state.photos.concat(newPhotos), loading: false }; }); },
    setViewMode: function (mode) { set({ viewMode: mode, mapBoundsFilter: null }); },
    setMapBoundsFilter: function (bounds) { set({ mapBoundsFilter: bounds }); },
    setTimeFilter: function (key) { set({ timeFilter: key }); },
    setSelectedIndex: function (index) { set({ selectedIndex: index }); },
    setSelectedTripId: function (id) { set({ selectedTripId: id }); },
    setTheme: function (theme) { set({ theme: theme }); },
    updatePhoto: function (path, nextPhoto) { set(function (state) { return { photos: state.photos.map(function (p) { return p.path === path ? Object.assign({}, p, nextPhoto) : p; }) }; }); },

    setDetectionParams: function (params) { saveParams(params); set({ detectionParams: params }); },

    setLocusMetadata: function (metadata) {
      set({ locusMetadata: metadata || { version: 1, residenceOverrides: {}, tripOverrides: {}, heartedPhotos: [] } });
    },
    updateResidenceOverride: function (residenceId, override) {
      set(function (state) { var next = JSON.parse(JSON.stringify(state.locusMetadata)); next.residenceOverrides[residenceId] = override; return { locusMetadata: next }; });
    },
    updateTripOverride: function (tripId, override) {
      set(function (state) { var next = JSON.parse(JSON.stringify(state.locusMetadata)); next.tripOverrides[tripId] = override; return { locusMetadata: next }; });
    },
    toggleHeartedPhoto: function (photoId) {
      set(function (state) { var next = JSON.parse(JSON.stringify(state.locusMetadata)); var idx = next.heartedPhotos.indexOf(photoId); if (idx >= 0) next.heartedPhotos.splice(idx, 1); else next.heartedPhotos.push(photoId); return { locusMetadata: next }; });
    },

    setPlaceNames: function (names) { set({ placeNames: names }); },

    getGeotaggedPhotos: function () {
      return get().photos.filter(function (p) { return p.lat != null; });
    },

    getResidenceData: function () {
      var state = get();
      if (state.photos.length === 0) return { residences: [], trips: [], noise: [], excursions: [] };
      // Memoization key: photo count + param hash
      var key = state.photos.length + '|' + JSON.stringify(state.detectionParams) + '|' + JSON.stringify(state.locusMetadata.residenceOverrides);
      if (key === _residenceCacheKey && _residenceCache) return _residenceCache;
      _residenceCacheKey = key;
      set({ detecting: true });
      var raw = detectAll(state.photos, state.detectionParams);
      _residenceCache = applyCorrections(raw, state.locusMetadata);
      set({ detecting: false });
      return _residenceCache;
    },

    getTrips: function () {
      var data = get().getResidenceData();
      var exc = data.excursions || [];
      if (exc.length === 0) return [];
      var state = get();
      var key = exc.length + '|' + JSON.stringify(state.locusMetadata.tripOverrides);
      if (key === _tripCacheKey && _tripCache) return _tripCache;
      _tripCacheKey = key;
      var rawTrips = detectTrips(exc, state.detectionParams);
      var meta = state.locusMetadata;
      _tripCache = rawTrips.filter(function (t) { var ov = meta.tripOverrides[t.id]; return !ov || !ov.ignored; }).map(function (t) { var ov = meta.tripOverrides[t.id]; if (ov && ov.name) t.displayName = ov.name; return t; });
      return _tripCache;
    },

    getDisplayName: function (item) {
      if (!item) return "";
      return item.displayName || item.id || "";
    },

    getTripById: function (id) {
      var trips = get().getTrips();
      for (var i = 0; i < trips.length; i++) { if (trips[i].id === id) return trips[i]; }
      return null;
    }
  };
});

function applyCorrections(rawData, metadata) {
  var residences = (rawData.residences || []).filter(function (x) {
    var ov = (metadata.residenceOverrides || {})[x.id];
    return !ov || !ov.ignored;
  }).map(function (x) {
    var ov = (metadata.residenceOverrides || {})[x.id];
    if (ov && ov.name) x.displayName = ov.name;
    return x;
  });
  return { residences: residences, trips: rawData.trips || [], noise: rawData.noise || [], excursions: rawData.excursions || [] };
}
