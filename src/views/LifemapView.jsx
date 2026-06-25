import { useEffect, useRef, useMemo, useState } from 'react';
import { usePhotoStore } from '../store/photoStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import TimeCursor from '../components/TimeCursor';
import LayerControl from '../components/LayerControl';
import PhotoLightbox from '../components/PhotoLightbox';
import CorrectionPanel from '../components/CorrectionPanel';
import { batchReverseGeocode, placeSummary, tripPlaceLabel } from '../services/reverseGeocoder.js';
import { getConfiguredAmapKey } from '../services/amapConfig.js';

var TILES = {
  CartoDB: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    opt: { subdomains: 'abcd', maxZoom: 19, attribution: '&copy; CARTO' }
  },
  '\u9AD8\u5FB7': {
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    opt: { subdomains: '1234', maxZoom: 18, attribution: '&copy; \u9AD8\u5FB7' }
  },
  OSM: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    opt: { maxZoom: 19, attribution: '&copy; OSM' }
  }
};

var TRIP_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function LifemapView() {
  var photos = usePhotoStore(function (s) { return s.photos; });
  var getResidenceData = usePhotoStore(function (s) { return s.getResidenceData; });
  var getTrips = usePhotoStore(function (s) { return s.getTrips; });

  var containerRef = useRef(null);
  var mapRef = useRef(null);
  var tileRef = useRef(null);
  var clusterRef = useRef(null);
  var heatLayerRef = useRef(null);
  var tripLinesRef = useRef([]);
  var markersRef = useRef([]);
  var initRef = useRef(false);

  var _t = useState('\u9AD8\u5FB7'), tileKey = _t[0], setTileKey = _t[1];
  var _lb = useState({ index: -1, photos: [] }), lightbox = _lb[0], setLightbox = _lb[1];
  var _ly = useState({ heatmap: true, trajectories: true, scatter: true }), layers = _ly[0], setLayers = _ly[1];
  var _cp = useState(null), correctionItem = _cp[0], setCorrectionItem = _cp[1];

  var residenceData = getResidenceData();
  var trips = getTrips();
  var geotaggedPhotos = photos.filter(function (p) { return p.lat != null; });

  var _tr = useState(null), timeRange = _tr[0], setTimeRange = _tr[1];
  var allTimes = useMemo(function () {
    var times = geotaggedPhotos.filter(function (p) { return p.datetime != null; }).map(function (p) { return p.datetime; });
    if (times.length === 0) return { min: null, max: null };
    return { min: new Date(Math.min.apply(null, times)), max: new Date(Math.max.apply(null, times)) };
  }, [geotaggedPhotos]);

  // Init map
  useEffect(function () {
    if (initRef.current) return;
    var el = containerRef.current;
    if (!el) return;

    var map = L.map(el, { zoomControl: true }).setView([35, 105], 4);
    mapRef.current = map;
    tileRef.current = L.tileLayer(TILES[tileKey].url, TILES[tileKey].opt).addTo(map);

    var cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (c) {
        var count = c.getChildCount();
        var size = count < 10 ? 36 : count < 100 ? 44 : 52;
        return L.divIcon({
          html: '<div><span>' + count + '</span></div>',
          className: 'marker-cluster marker-cluster-dark',
          iconSize: L.point(size, size)
        });
      }
    });
    clusterRef.current = cluster;
    map.addLayer(cluster);

    initRef.current = true;

    setTimeout(function () { if (mapRef.current) mapRef.current.invalidateSize(); }, 200);

    return function () {
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
      clusterRef.current = null;
      heatLayerRef.current = null;
    };
  }, []);

  // Reverse geocoding for trip labels
  useEffect(function () {
    if (trips.length === 0) return;
    var amapKey = getConfiguredAmapKey();
    if (!amapKey) return;

    var coords = [];
    trips.forEach(function (trip) {
      if (trip.path && trip.path.length > 0) {
        coords.push({ lat: trip.path[0].lat, lng: trip.path[0].lng });
        if (trip.path.length > 1) coords.push({ lat: trip.path[trip.path.length - 1].lat, lng: trip.path[trip.path.length - 1].lng });
      }
    });

    if (coords.length === 0) return;
    batchReverseGeocode(coords, amapKey).then(function (results) {
      var store = usePhotoStore.getState();
      var names = Object.assign({}, store.placeNames);
      for (var i = 0; i < coords.length; i++) {
        if (results[i]) {
          var key = coords[i].lat.toFixed(4) + ',' + coords[i].lng.toFixed(4);
          names[key] = results[i];
        }
      }
      store.setPlaceNames(names);
    });
  }, [trips]);

  // Tile switch
  useEffect(function () {
    var map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(TILES[tileKey].url, TILES[tileKey].opt).addTo(map);
  }, [tileKey]);

  // Filter photos by time range
  var filteredPhotos = useMemo(function () {
    if (!timeRange) return geotaggedPhotos;
    return geotaggedPhotos.filter(function (p) {
      return p.datetime && p.datetime >= timeRange.start && p.datetime <= timeRange.end;
    });
  }, [geotaggedPhotos, timeRange]);

  // Scatter markers
  useEffect(function () {
    var map = mapRef.current;
    var cluster = clusterRef.current;
    if (!map || !cluster || !layers.scatter) {
      if (cluster) cluster.clearLayers();
      return;
    }

    cluster.clearLayers();
    markersRef.current = [];

    if (filteredPhotos.length === 0) return;

    var groups = {};
    filteredPhotos.forEach(function (photo, idx) {
      if (photo.lat == null) return;
      var key = photo.lat.toFixed(6) + ',' + photo.lng.toFixed(6);
      if (!groups[key]) groups[key] = { photos: [], firstIdx: idx };
      groups[key].photos.push(photo);
    });

    var bounds = L.latLngBounds([]);
    Object.keys(groups).forEach(function (key) {
      var group = groups[key];
      var count = group.photos.length;
      var firstPhoto = group.photos[0];

      bounds.extend([firstPhoto.lat, firstPhoto.lng]);

      var sz = 42;
      var icon = L.divIcon({
        html: '<div class="thumb-marker"><img src="' + firstPhoto.thumbnailUrl + '" alt="" /><span class="thumb-count">' + count + '</span></div>',
        className: 'thumb-marker-wrapper',
        iconSize: [sz, sz],
        iconAnchor: [sz / 2, sz],
        popupAnchor: [0, -sz]
      });

      var marker = L.marker([firstPhoto.lat, firstPhoto.lng], { icon: icon, photoThumb: firstPhoto.thumbnailUrl, photoCount: count });
      marker.on('click', function () { setLightbox({ index: group.firstIdx, photos: group.photos }); });
      cluster.addLayer(marker);
      markersRef.current.push(marker);
    });

    if (bounds.isValid() && markersRef.current.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }, [filteredPhotos, layers.scatter]);

  // Trip trajectory lines
  useEffect(function () {
    var map = mapRef.current;
    if (!map) return;

    tripLinesRef.current.forEach(function (line) { map.removeLayer(line); });
    tripLinesRef.current = [];

    if (!layers.trajectories) return;

    var displayTrips = trips;
    if (timeRange) {
      displayTrips = trips.filter(function (t) {
        return t.startTime <= timeRange.end && t.endTime >= timeRange.start;
      });
    }

    displayTrips.forEach(function (trip, idx) {
      if (!trip.path || trip.path.length < 2) return;
      var color = TRIP_COLORS[idx % TRIP_COLORS.length];
      var latlngs = trip.path.map(function (p) { return [p.lat, p.lng]; });
      var line = L.polyline(latlngs, { color: color, weight: 3, opacity: 0.8 });
      line.addTo(map);

      var name = trip.displayName || trip.id || '';
      if (trip.path.length > 0) {
        var start = trip.path[0];
        L.marker([start.lat, start.lng], {
          icon: L.divIcon({ html: '<div style="background:' + color + ';color:white;padding:2px 6px;border-radius:3px;font-size:11px;white-space:nowrap">' + (name || '\u25CF') + '</div>', className: '' })
        }).addTo(map);
      }

      tripLinesRef.current.push(line);
    });
  }, [trips, timeRange, layers.trajectories]);

  // Heatmap layer — canvas-based for performance
  useEffect(function () {
    var map = mapRef.current;
    if (!map) return;
    if (heatLayerRef.current) { map.removeLayer(heatLayerRef.current); heatLayerRef.current = null; }
    if (!layers.heatmap) return;

    var heatPoints = [];
    (residenceData.residences || []).forEach(function (res) {
      (res.photos || []).forEach(function (p) {
        if (p.lat != null && p.lng != null) {
          if (!timeRange || (p.datetime && p.datetime >= timeRange.start && p.datetime <= timeRange.end)) {
            heatPoints.push({ lat: p.lat, lng: p.lng });
          }
        }
      });
    });

    if (heatPoints.length === 0) return;

    // Single canvas overlay for all heat points
    var HeatCanvas = L.Canvas.extend({
      _updateStyle: function (layer) { /* no-op — drawn in _onPaint */ }
    });

    var drawHeat = L.Layer.extend({
      initialize: function (points, map) { this._points = points; this._map = map; },
      onAdd: function () { /* handled by canvas */ },
      _containsPoint: function () { return false; }
    });

    // Use L.Canvas with custom draw
    heatLayerRef.current = L.canvas({ padding: 0.5 });

    heatLayerRef.current._draw = function () {
      var ctx = this._ctx;
      var size = this._map.getSize();
      if (!ctx || size.x === 0) return;

      ctx.clearRect(0, 0, size.x, size.y);

      for (var i = 0; i < heatPoints.length; i++) {
        var pt = heatPoints[i];
        var px = this._map.latLngToContainerPoint([pt.lat, pt.lng]);
        if (px.x < -20 || px.x > size.x + 20 || px.y < -20 || px.y > size.y + 20) continue;

        var gradient = ctx.createRadialGradient(px.x, px.y, 0, px.x, px.y, 30);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
        gradient.addColorStop(0.4, 'rgba(239, 68, 68, 0.15)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(px.x - 30, px.y - 30, 60, 60);
      }
    };

    heatLayerRef.current.addTo(map);
  }, [residenceData, timeRange, layers.heatmap]);

  var layerDefs = [
    { id: 'heatmap', label: '\u5C45\u4F4F\u70ED\u529B', visible: layers.heatmap },
    { id: 'trajectories', label: '\u65C5\u884C\u8F68\u8FF9', visible: layers.trajectories },
    { id: 'scatter', label: '\u7167\u7247\u6563\u70B9', visible: layers.scatter }
  ];

  function handleLayerToggle(id, visible) {
    setLayers(Object.assign({}, layers, { heatmap: id === 'heatmap' ? visible : layers.heatmap, trajectories: id === 'trajectories' ? visible : layers.trajectories, scatter: id === 'scatter' ? visible : layers.scatter }));
  }

  function handleReset() {
    var map = mapRef.current;
    if (!map || geotaggedPhotos.length === 0) return;
    var bounds = L.latLngBounds([]);
    geotaggedPhotos.forEach(function (p) { bounds.extend([p.lat, p.lng]); });
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
  }

  return (
    <div className="lifemap-view">
      <div className="map-wrapper">
        <div ref={containerRef} className="map-inner" />
        <div className="tile-switcher">
          {Object.keys(TILES).map(function (k) {
            return <button key={k} className={'tile-btn' + (tileKey === k ? ' active' : '')} onClick={function () { setTileKey(k); }}>{k}</button>;
          })}
        </div>
        <LayerControl layers={layerDefs} onToggle={handleLayerToggle} />
        {geotaggedPhotos.length > 0 ? <button className="map-reset-btn" onClick={handleReset} title="\u91CD\u7F6E\u89C6\u56FE">{'\u21BA'}</button> : null}
      </div>

        {correctionItem ? <CorrectionPanel item={correctionItem} itemType={correctionItem._type || 'residence'} onClose={function () { setCorrectionItem(null); }} /> : null}

        <div className="residence-list">
          {(residenceData.residences || []).map(function (res) {
            return (
              <div key={res.id} className="residence-chip" onClick={function () { setCorrectionItem(Object.assign({}, res, {_type: 'residence'})); }}>
                <span className="residence-chip-name">{res.displayName || res.id}</span>
                <span className="residence-chip-meta">{res.photos.length} 张 · {Math.round(res.durationDays)} 天</span>
                <button className="residence-chip-edit" onClick={function (e) { e.stopPropagation(); setCorrectionItem(Object.assign({}, res, {_type: 'residence'})); }}>✎</button>
              </div>
            );
          })}
        </div>

      {allTimes.min && allTimes.max ? (
        <TimeCursor
          minTime={allTimes.min}
          maxTime={allTimes.max}
          rangeStart={timeRange ? timeRange.start : allTimes.min}
          rangeEnd={timeRange ? timeRange.end : allTimes.max}
          onChange={function (range) { setTimeRange(range); }}
        />
      ) : null}

      {lightbox.index >= 0 ? (
        <PhotoLightbox photos={lightbox.photos} index={0}
          onClose={function () { setLightbox({ index: -1, photos: [] }); }} />
      ) : null}
    </div>
  );
}

export default LifemapView;
