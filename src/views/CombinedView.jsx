import { useMemo, useState, useRef, useCallback } from 'react';
import { usePhotoStore } from '../store/photoStore';
import MapComponent from '../components/MapComponent';
import PhotoCard from '../components/PhotoCard';
import PhotoLightbox from '../components/PhotoLightbox';

var MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
var COLUMN_OPTIONS = [2, 3, 4, 5];

function CombinedView() {
  var photos = usePhotoStore(function (s) { return s.photos; });
  var timeFilter = usePhotoStore(function (s) { return s.timeFilter; });
  var setTimeFilter = usePhotoStore(function (s) { return s.setTimeFilter; });
  var _a = useState(null), drawerPhotos = _a[0], setDrawerPhotos = _a[1];
  var _b = useState(-1), lbIdx = _b[0], setLbIdx = _b[1];
  var _c = useState(0.4), drawerRatio = _c[0], setDrawerRatio = _c[1];
  var _d = useState(3), cols = _d[0], setCols = _d[1];
  var scrollRef = useRef(null);

  var geotagged = useMemo(function () {
    return photos.filter(function (p) { return p.lat != null; });
  }, [photos]);

  var geotaggedFiltered = useMemo(function () {
    if (!timeFilter) return geotagged;
    return geotagged.filter(function (p) {
      if (!p.datetime) return false;
      var monthKey = p.datetime.getFullYear() + '-' + String(p.datetime.getMonth()).padStart(2, '0');
      var dayKey = p.datetime.getFullYear() + '-' + String(p.datetime.getMonth() + 1).padStart(2, '0') + '-' + String(p.datetime.getDate()).padStart(2, '0');
      return monthKey === timeFilter || dayKey === timeFilter;
    });
  }, [geotagged, timeFilter]);

  var yearGroups = useMemo(function () {
    var g = {};
    photos.forEach(function (photo) {
      var d = photo.datetime;
      var yr, mo;
      if (!d) { yr = '--'; mo = '--'; }
      else { yr = String(d.getFullYear()); mo = String(d.getMonth()); }
      if (!g[yr]) g[yr] = {};
      if (!g[yr][mo]) g[yr][mo] = 0;
      g[yr][mo]++;
    });
    return g;
  }, [photos]);

  var years = Object.keys(yearGroups)
    .filter(function (y) { return y !== '--'; })
    .sort(function (a, b) { return Number(b) - Number(a); });

  function handleTimeClick(key) {
    setTimeFilter(timeFilter === key ? null : key);
    setDrawerPhotos(null);
  }

  function handleMarkerClick(photoList) {
    setDrawerRatio(0.4);
    setDrawerPhotos(photoList);
  }

  var onDragStart = useCallback(function (e) {
    var mapEl = document.querySelector('.combined-map');
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

  var totalGeotagged = geotagged.length;

  return (
    <div className="combined-view">
      <div className="combined-map">
        <MapComponent
          geotaggedPhotos={geotaggedFiltered}
          onBoundsChanged={function () {}}
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
            <div className="zoom-controls" style={{ padding: "0 20px 8px" }}>
          <span className="zoom-label">列</span>
          {COLUMN_OPTIONS.map(function (n) {
            return (
              <button key={n} className={"zoom-btn" + (n === cols ? " active" : "")}
                onClick={function () { setCols(n); }}>{n}</button>
            );
          })}
          <input className="zoom-input" type="number" min="1" max="12" value={cols}
            onChange={function (e) {
              var v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 12) setCols(v);
            }} />
        </div>
        <div className="photo-drawer-wall" style={{ columns: cols }}>
              {drawerPhotos.map(function (photo, idx) {
                return (
                  <PhotoCard key={photo.id} photo={photo}
                    onClick={function () {
                      var globalIdx = geotagged.indexOf(photo);
                      setLbIdx(globalIdx >= 0 ? globalIdx : 0);
                    }} />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="filter-bar">
        <div className="filter-bar-row" ref={scrollRef}>
          <button
            className={'filter-chip' + (!timeFilter ? ' active' : '')}
            onClick={function () { setTimeFilter(null); }}
          >全部 · {totalGeotagged}</button>
          {years.map(function (year) {
            var months = yearGroups[year];
            var monthKeys = Object.keys(months).sort(function (a, b) { return Number(b) - Number(a); });
            return (
              <div key={year} className="filter-year-group">
                <span className="filter-year-label">{year}</span>
                {monthKeys.map(function (mo) {
                  var key = year + '-' + mo.padStart(2, '0');
                  var isActive = timeFilter === key;
                  return (
                    <button
                      key={key}
                      className={'filter-chip' + (isActive ? ' active' : '')}
                      onClick={function () { handleTimeClick(key); }}
                    >{MONTHS[Number(mo)]} · {months[mo]}</button>
                  );
                })}
              </div>
            );
          })}
          {yearGroups['--'] ? (
            <div className="filter-year-group">
              <span className="filter-year-label">--</span>
              <button
                className={'filter-chip' + (timeFilter === 'unknown' ? ' active' : '')}
                onClick={function () { handleTimeClick('unknown'); }}
              >未知 · {yearGroups['--']['--']}</button>
            </div>
          ) : null}
        </div>
      </div>
      {lbIdx >= 0 ? (
        <PhotoLightbox photos={geotagged} index={lbIdx}
          onClose={function () { setLbIdx(-1); }} />
      ) : null}
    </div>
  );
}

export default CombinedView;


