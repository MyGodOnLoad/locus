import { useEffect, useRef, useMemo, useState } from 'react';
import { usePhotoStore } from '../store/photoStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PhotoCard from '../components/PhotoCard';
import PhotoLightbox from '../components/PhotoLightbox';
import CorrectionPanel from '../components/CorrectionPanel';
import TripNarrative from '../components/TripNarrative';
import { createReplayController } from '../services/replayController';
import { exportHtmlDiary, exportGpx } from '../services/tripExporter';
import { saveAs } from 'file-saver';
import ReplayController from '../components/ReplayController';

function TripDetailView() {
  var setViewMode = usePhotoStore(function (s) { return s.setViewMode; });
  var getTripById = usePhotoStore(function (s) { return s.getTripById; });
  var selectedTripId = usePhotoStore(function (s) { return s.selectedTripId; });
  var trip = selectedTripId ? getTripById(selectedTripId) : null;

  var containerRef = useRef(null);
  var mapRef = useRef(null);
  var tileRef = useRef(null);
  var initRef = useRef(false);
  var _lb = useState(-1), lbIdx = _lb[0], setLbIdx = _lb[1];
  var _cp = useState(false), showCorrection = _cp[0], setShowCorrection = _cp[1];
  var _rp = useState(false), replayActive = _rp[0], setReplayActive = _rp[1];
  var replayRef = useRef(null);
  var placeNames = usePhotoStore(function (s) { return s.placeNames; });

  if (!trip) {
    return (
      <div className="trip-detail-view">
        <button className="correction-trigger-btn" onClick={function () { setShowCorrection(!showCorrection); }} title={"编辑"}>✎</button>
        <button className="back-btn" onClick={function () { setViewMode('trip-list'); }}>{'\u2190 \u65C5\u884C\u5217\u8868'}</button>
        <div className="empty-state"><p>{'\u672A\u627E\u5230\u65C5\u884C\u4FE1\u606F'}</p></div>
      </div>
    );
  }

  var name = trip.displayName || trip.id || '';
  var photoCount = trip.photoCount || trip.photos.length;
  var photos = trip.photos || [];
  var startStr = trip.startTime ? trip.startTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  var endStr = trip.endTime ? trip.endTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  var durationDays = trip.startTime && trip.endTime ? Math.ceil((trip.endTime.getTime() - trip.startTime.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;

  // Group photos by day
  var dayGroups = useMemo(function () {
    var groups = {};
    photos.forEach(function (p) {
      if (!p.datetime) return;
      var key = p.datetime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [photos]);

  // Compute day location summaries from reverse geocoding
  var dayLocationSummaries = {};
  Object.keys(dayGroups).forEach(function (dayKey) {
    var dayPhotos = dayGroups[dayKey];
    var placeSet = [];
    var seen = {};
    for (var i = 0; i < dayPhotos.length; i++) {
      var dp = dayPhotos[i];
      if (dp.lat == null || dp.lng == null) continue;
      var pk = dp.lat.toFixed(4) + ',' + dp.lng.toFixed(4);
      var pn = placeNames[pk];
      var label = pn ? (pn.city || pn.district || pn.township || '') : '';
      if (label && !seen[label]) { seen[label] = true; placeSet.push(label); }
    }
    dayLocationSummaries[dayKey] = placeSet.length > 0 ? placeSet.join(' → ') : '';
  });

  var dayKeys = Object.keys(dayGroups).sort(function (a, b) { return a.localeCompare(b); });

  // Map init
  useEffect(function () {
    if (initRef.current || !containerRef.current) return;
    var map = L.map(containerRef.current, { zoomControl: true }).setView([35, 105], 5);
    mapRef.current = map;
    tileRef.current = L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: '1234', maxZoom: 18, attribution: '&copy; \u9AD8\u5FB7'
    }).addTo(map);
    initRef.current = true;
    return function () { map.remove(); mapRef.current = null; };
  }, []);

  // Draw trajectory (only when NOT in replay mode)
  useEffect(function () {
    if (replayActive) return;
    var map = mapRef.current;
    if (!map || !trip.path || trip.path.length < 2) return;

    var latlngs = trip.path.map(function (p) { return [p.lat, p.lng]; });
    var line = L.polyline(latlngs, { color: '#3b82f6', weight: 4, opacity: 0.9 }).addTo(map);

    var start = trip.path[0];
    var end = trip.path[trip.path.length - 1];
    L.circleMarker([start.lat, start.lng], { radius: 6, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }).addTo(map);
    L.circleMarker([end.lat, end.lng], { radius: 6, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }).addTo(map);

    if (placeNames) {
      var labelIndices = [0];
      if (trip.path.length > 1) labelIndices.push(trip.path.length - 1);
      if (trip.path.length > 4) labelIndices.push(Math.floor(trip.path.length / 2));
      labelIndices.forEach(function (idx) {
        var pt = trip.path[idx];
        var pk = pt.lat.toFixed(4) + ',' + pt.lng.toFixed(4);
        var pn = placeNames[pk];
        if (pn) {
          var label = pn.city || pn.district || pn.township || '';
          if (label) {
            L.marker([pt.lat, pt.lng], {
              icon: L.divIcon({
                className: 'trip-map-label',
                html: '<span>' + label + '</span>',
                iconSize: [80, 20],
                iconAnchor: [40, 10]
              })
            }).addTo(map);
          }
        }
      });
    }

    if (trip.boundingBox) {
      map.fitBounds([[trip.boundingBox.south, trip.boundingBox.west], [trip.boundingBox.north, trip.boundingBox.east]], { padding: [30, 30] });
    } else {
      map.fitBounds(line.getBounds(), { padding: [30, 30] });
    }
  }, [trip, placeNames, replayActive]);

  // Initialize replay controller
  useEffect(function () {
    if (!replayActive || !mapRef.current || !trip.path || trip.path.length < 2) return;
    var rp = createReplayController(trip, mapRef.current, {});
    replayRef.current = rp;
    return function () {
      if (replayRef.current) { replayRef.current.stop(); replayRef.current = null; }
    };
  }, [replayActive]);

  var allPhotos = photos;

  return (
    <div className="trip-detail-view">
      <div className="trip-detail-header">
        {showCorrection ? <CorrectionPanel item={trip} itemType={'trip'} onClose={function () { setShowCorrection(false); }} /> : null}
        <button className="back-btn" onClick={function () { setViewMode('trip-list'); }}>
          {'\u2190 \u65C5\u884C\u5217\u8868'}
        </button>
        <button className="replay-trigger-btn" onClick={function () { setReplayActive(!replayActive); }} title={'\u65C5\u884C\u56DE\u653E'}>
          {'\u25B6'}
        </button>
        <div className="trip-detail-title">
          <h2>{name}</h2>
          <div className="trip-detail-meta">
            {startStr} {'\u2192'} {endStr} {'\u00B7'} {durationDays} {'\u5929'} {'\u00B7'} {photoCount} {'\u5F20\u7167\u7247'}
          </div>
        </div>
        <div className="trip-detail-actions">
          <button className="export-btn" onClick={function () {
            exportHtmlDiary(trip, placeNames).then(function (html) {
              var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
              saveAs(blob, (trip.displayName || 'travel-diary') + '.html');
            }).catch(function (e) { console.error('Export failed:', e); });
          }}>{'\u5BFC\u51FA\u65C5\u884C\u65E5\u8BB0'}</button>
          <button className="export-btn" onClick={function () {
            var gpx = exportGpx(trip);
            if (!gpx) return;
            var blob = new Blob([gpx], { type: 'application/gpx+xml;charset=utf-8' });
            saveAs(blob, (trip.displayName || 'track') + '.gpx');
          }}>{'\u5BFC\u51FA GPX'}</button>
        </div>
      </div>

      <TripNarrative trip={trip} />

      {replayActive ? <ReplayController controller={replayRef.current} onExit={function () { setReplayActive(false); }} /> : null}

      <div className="trip-detail-map">
        <div ref={containerRef} className="map-inner" />
      </div>

      <div className="trip-detail-photos">
        {dayKeys.map(function (dayKey) {
          var dayPhotos = dayGroups[dayKey];
          return (
            <div key={dayKey} className="photo-day-group">
              <div className="photo-day-header">
                <span className="photo-day-date">{dayKey}</span>
                {dayLocationSummaries[dayKey] ? <span className="photo-day-location">{dayLocationSummaries[dayKey]}</span> : null}
                <span className="photo-day-count">{dayPhotos.length} {'\u5F20'}</span>
              </div>
              <div className="photo-day-grid">
                {dayPhotos.map(function (photo, idx) {
                  var globalIdx = allPhotos.indexOf(photo);
                  return (
                    <PhotoCard key={photo.id || photo.path} photo={photo}
                      onClick={function () { setLbIdx(globalIdx >= 0 ? globalIdx : 0); }} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {lbIdx >= 0 ? (
        <PhotoLightbox photos={allPhotos} index={lbIdx}
          onClose={function () { setLbIdx(-1); }} />
      ) : null}
    </div>
  );
}

export default TripDetailView;