import { useMemo, useState, useRef, useCallback } from 'react';
import { usePhotoStore } from '../store/photoStore';
import MapComponent from '../components/MapComponent';
import PhotoCard from '../components/PhotoCard';
import PhotoLightbox from '../components/PhotoLightbox';

function MapView() {
  var photos = usePhotoStore(function (s) { return s.photos; });
  var setMapBoundsFilter = usePhotoStore(function (s) { return s.setMapBoundsFilter; });
  var _a = useState(null), drawerPhotos = _a[0], setDrawerPhotos = _a[1];
  var _b = useState(-1), lightboxIdx = _b[0], setLightboxIdx = _b[1];
  var _c = useState(0.4), drawerRatio = _c[0], setDrawerRatio = _c[1];
  var dragRef = useRef(null);

  var geotagged = useMemo(function () {
    return photos.filter(function (p) { return p.lat != null; });
  }, [photos]);

  var noGps = photos.length - geotagged.length;

  function handleMarkerClick(photoList) {
    setDrawerRatio(0.4);
    setDrawerPhotos(photoList);
  }

  var onDragStart = useCallback(function (e) {
    var mapEl = document.querySelector('.map-wrapper');
    if (!mapEl) return;
    var mapH = mapEl.getBoundingClientRect().height;
    var startY = e.touches ? e.touches[0].clientY : e.clientY;
    var startRatio = drawerRatio;

    function onMove(ev) {
      var y = ev.touches ? ev.touches[0].clientY : ev.clientY;
      var dy = startY - y;
      var newRatio = startRatio + dy / mapH;
      newRatio = Math.max(0.2, Math.min(0.85, newRatio));
      setDrawerRatio(newRatio);
    }

    function onEnd() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, [drawerRatio]);

  return (
    <div className="map-view">
      {noGps > 0 ? (
        <div className="gps-info-banner">
          {noGps + ' 张照片无GPS信息 \u2014 仅在地图+时间轴中显示'}
        </div>
      ) : null}
      <MapComponent
        geotaggedPhotos={geotagged}
        onBoundsChanged={function (bounds) { setMapBoundsFilter(bounds); }}
        selectedIndex={-1}
        onMarkerClick={handleMarkerClick}
      />

      {drawerPhotos ? (
        <div className="photo-drawer-overlay" onClick={function () { setDrawerPhotos(null); }} />
      ) : null}
      {drawerPhotos ? (
        <div className="photo-drawer" style={{ height: (drawerRatio * 100) + '%' }}>
          <div
            className="photo-drawer-handle"
            onMouseDown={onDragStart}
            onTouchStart={function (e) { e.preventDefault(); onDragStart(e); }}
          />
          <div className="photo-drawer-header">
            <span className="photo-drawer-title">{drawerPhotos.length + ' 张照片'}</span>
            <button className="photo-drawer-close" onClick={function () { setDrawerPhotos(null); }}>
              &#x2715;
            </button>
          </div>
          <div className="photo-drawer-wall">
            {drawerPhotos.map(function (photo, idx) {
              return (
                <PhotoCard key={photo.id} photo={photo}
                  onClick={function () {
                    var globalIdx = geotagged.indexOf(photo);
                    setLightboxIdx(globalIdx >= 0 ? globalIdx : 0);
                  }} />
              );
            })}
          </div>
        </div>
      ) : null}

      {lightboxIdx >= 0 ? (
        <PhotoLightbox photos={geotagged} index={lightboxIdx}
          onClose={function () { setLightboxIdx(-1); }} />
      ) : null}
    </div>
  );
}

export default MapView;
