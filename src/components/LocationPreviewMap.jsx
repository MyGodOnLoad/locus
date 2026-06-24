import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

var AMAP_TILE_URL = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}';
var AMAP_TILE_OPT = { subdomains: '1234', maxZoom: 18, attribution: '&copy; 高德' };

function LocationPreviewMap(props) {
  var lat = props.lat;
  var lng = props.lng;
  var label = props.label;
  var containerRef = useRef(null);
  var mapRef = useRef(null);
  var markerRef = useRef(null);

  useEffect(function () {
    var el = containerRef.current;
    if (!el || mapRef.current) return;

    var map = L.map(el, { zoomControl: false, attributionControl: false, dragging: true, scrollWheelZoom: false });
    mapRef.current = map;
    L.tileLayer(AMAP_TILE_URL, AMAP_TILE_OPT).addTo(map);

    setTimeout(function () {
      var m = mapRef.current;
      if (m) m.invalidateSize();
    }, 120);

    return function () {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(function () {
    var map = mapRef.current;
    if (!map || lat == null || lng == null) return;

    var point = [lat, lng];
    var icon = L.divIcon({
      html: '<div class="location-preview-pin"></div>',
      className: 'location-preview-pin-wrap',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    if (!markerRef.current) {
      markerRef.current = L.marker(point, { icon: icon }).addTo(map);
    } else {
      markerRef.current.setLatLng(point);
    }
    if (label) markerRef.current.bindTooltip(label, { direction: 'top', offset: [0, -8] });
    map.setView(point, 15);
    setTimeout(function () { if (mapRef.current) mapRef.current.invalidateSize(); }, 80);
  }, [lat, lng, label]);

  return (
    <div className="location-preview-shell">
      <div ref={containerRef} className="location-preview-map" />
      {lat == null || lng == null ? <div className="location-preview-empty">输入详细地址并解析后，在这里确认位置。</div> : null}
    </div>
  );
}

export default LocationPreviewMap;
