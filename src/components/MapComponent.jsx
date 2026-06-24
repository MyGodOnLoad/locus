import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

var TILES = {
  CartoDB: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    opt: { subdomains: 'abcd', maxZoom: 19, attribution: '&copy; CARTO' }
  },
  高德: {
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    opt: { subdomains: '1234', maxZoom: 18, attribution: '&copy; 高德' }
  },
  OSM: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    opt: { maxZoom: 19, attribution: '&copy; OSM' }
  }
};

function thumbIcon(thumbnailUrl, count) {
  var sz = 48;
  return L.divIcon({
    html: '<div class="thumb-marker">' +
      '<img src="' + thumbnailUrl + '" alt="" />' +
      '<span class="thumb-count">' + count + '</span>' +
      '</div>',
    className: 'thumb-marker-wrapper',
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz],
    popupAnchor: [0, -sz]
  });
}

function clusterThumbIcon(thumbnailUrl, count) {
  var sz = count < 10 ? 52 : count < 50 ? 60 : 68;
  return L.divIcon({
    html: '<div class="thumb-cluster" style="width:' + sz + 'px;height:' + sz + 'px">' +
      '<img src="' + thumbnailUrl + '" alt="" />' +
      '<span class="thumb-count">' + count + '</span>' +
      '</div>',
    className: 'thumb-cluster-wrapper',
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2]
  });
}

function MapComponent(props) {
  var geotaggedPhotos = props.geotaggedPhotos;
  var onBoundsChanged = props.onBoundsChanged;
  var selectedIndex = props.selectedIndex;
  var onMarkerClick = props.onMarkerClick;

  var containerRef = useRef(null);
  var mapRef = useRef(null);
  var tileRef = useRef(null);
  var markersRef = useRef([]);
  var clusterRef = useRef(null);
  var initRef = useRef(false);

  var _a = useState('高德'), tileKey = _a[0], setTileKey = _a[1];

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
        var children = c.getAllChildMarkers();
        var thumb = children.length > 0 && children[0].options.photoThumb
          ? children[0].options.photoThumb
          : null;
        if (thumb) {
          return clusterThumbIcon(thumb, count);
        }
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

    map.on('moveend', function () {
      if (onBoundsChanged) onBoundsChanged(map.getBounds());
    });

    initRef.current = true;

    setTimeout(function () {
      var m = mapRef.current;
      if (!m) return;
      m.invalidateSize();
      if (onBoundsChanged) onBoundsChanged(m.getBounds());
    }, 200);

    return function () {
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
      clusterRef.current = null;
      markersRef.current = [];
      initRef.current = false;
    };
  }, []);

  useEffect(function () {
    var map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(TILES[tileKey].url, TILES[tileKey].opt).addTo(map);
  }, [tileKey]);

  function groupByLocation(photos) {
    var groups = {};
    photos.forEach(function (photo, idx) {
      var key = photo.lat.toFixed(7) + ',' + photo.lng.toFixed(7);
      if (!groups[key]) groups[key] = { photos: [], firstIdx: idx };
      groups[key].photos.push(photo);
    });
    return groups;
  }

  useEffect(function () {
    var map = mapRef.current;
    var cluster = clusterRef.current;
    if (!map || !cluster) return;

    markersRef.current.forEach(function (m) {
      if (m) cluster.removeLayer(m);
    });
    markersRef.current = [];

    if (geotaggedPhotos.length === 0) return;

    var bounds = L.latLngBounds([]);
    var groups = groupByLocation(geotaggedPhotos);

    Object.keys(groups).forEach(function (key) {
      var group = groups[key];
      var count = group.photos.length;
      var firstPhoto = group.photos[0];
      var firstIdx = group.firstIdx;

      bounds.extend([firstPhoto.lat, firstPhoto.lng]);

      var icon = thumbIcon(firstPhoto.thumbnailUrl, count);

      var marker = L.marker([firstPhoto.lat, firstPhoto.lng], {
        icon: icon,
        photoThumb: firstPhoto.thumbnailUrl,
        photoCount: count
      });

      marker.on('click', function () { if (onMarkerClick) onMarkerClick(group.photos); });

      var dateStr = firstPhoto.datetime ? firstPhoto.datetime.toLocaleDateString() : '';
      var popupHtml = '<div style="width:220px;text-align:center;background:#18181b;border-radius:6px;padding:6px">' +
        '<img src="' + firstPhoto.thumbnailUrl + '" style="max-width:200px;max-height:150px;border-radius:4px;display:block;margin:0 auto" />' +
        '<div style="font-size:11px;margin-top:4px;color:#a1a1aa">' + dateStr + '</div>';
      if (count > 1) {
        popupHtml += '<div style="font-size:11px;margin-top:2px;color:#3b82f6">+' + (count - 1) + ' 张照片</div>';
      }
      popupHtml += '</div>';
      marker.bindPopup(popupHtml);

      cluster.addLayer(marker);
      markersRef.current.push(marker);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }, [geotaggedPhotos]);

  useEffect(function () {
    var map = mapRef.current;
    if (!map || selectedIndex < 0 || selectedIndex >= geotaggedPhotos.length) return;
    var p = geotaggedPhotos[selectedIndex];
    map.flyTo([p.lat, p.lng], 14, { duration: 0.5 });
  }, [selectedIndex, geotaggedPhotos]);

  var tileNames = Object.keys(TILES);

  function handleReset() {
    var map = mapRef.current;
    if (!map || geotaggedPhotos.length === 0) return;
    var bounds = L.latLngBounds([]);
    geotaggedPhotos.forEach(function (p) { bounds.extend([p.lat, p.lng]); });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }

  return (
    <div className="map-wrapper">
      <div ref={containerRef} className="map-inner" />
      <div className="tile-switcher">
        {tileNames.map(function (k) {
          return (
            <button
              key={k}
              className={'tile-btn' + (tileKey === k ? ' active' : '')}
              onClick={function () { setTileKey(k); }}
            >{k}</button>
          );
        })}
      </div>
      {geotaggedPhotos.length > 0 ? (<button className="map-reset-btn" onClick={handleReset} title="重置视图">&#x21BA;</button>) : null}
    </div>
  );
}

export default MapComponent;


