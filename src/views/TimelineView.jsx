import { useMemo, useRef, useState } from 'react';
import { usePhotoStore } from '../store/photoStore';
import PhotoCard from '../components/PhotoCard';
import PhotoLightbox from '../components/PhotoLightbox';

var MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

var COLUMN_OPTIONS = [2, 3, 4, 5];

function TimelineView() {
  var photos = usePhotoStore(function (s) { return s.photos; });
  var _a = useState([]), lbPhotos = _a[0], setLbPhotos = _a[1];
  var _b = useState(-1), lbIdx = _b[0], setLbIdx = _b[1];
  var _c = useState(3), cols = _c[0], setCols = _c[1];
  var yearRefs = useRef({});

  

  var sorted = useMemo(function () {
    return photos.slice().sort(function (a, b) {
      var da = a.datetime ? a.datetime.getTime() : 0;
      var db = b.datetime ? b.datetime.getTime() : 0;
      return db - da;
    });
  }, [photos]);

  var grouped = useMemo(function () {
    var groups = {};
    sorted.forEach(function (photo) {
      var d = photo.datetime;
      if (!d) {
        if (!groups.unknown) groups.unknown = { months: {} };
        if (!groups.unknown.months['--']) groups.unknown.months['--'] = [];
        groups.unknown.months['--'].push(photo);
        return;
      }
      var year = String(d.getFullYear());
      if (!groups[year]) groups[year] = { months: {} };
      if (!groups[year].months[d.getMonth()]) groups[year].months[d.getMonth()] = [];
      groups[year].months[d.getMonth()].push(photo);
    });
    return groups;
  }, [sorted]);

  var years = Object.keys(grouped)
    .filter(function (k) { return k !== 'unknown'; })
    .sort(function (a, b) { return Number(b) - Number(a); });

  function openLightbox(monthPhotos, idx) {
    setLbPhotos(monthPhotos);
    setLbIdx(idx);
  }

  return (
    <div className="timeline-view">
      <div className="zoom-controls">
        <span className="zoom-label">列</span>
        {COLUMN_OPTIONS.map(function (n, i) {
          return (
            <button key={n} className={'zoom-btn' + (COLUMN_OPTIONS[i] === cols ? ' active' : '')}
              onClick={function () { setCols(COLUMN_OPTIONS[i]); }}>{n}</button>
          );
        })}
        <input
          className="zoom-input"
          type="number"
          min="1" max="12"
          value={cols}
          onChange={function (e) {
            var v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= 1 && v <= 12) {
              setCols(v);
            }
          }}
        />
      </div>

      {years.map(function (year) {
        return (
          <div key={year} ref={function (el) { yearRefs.current[year] = el; }}>
            <div className="timeline-year-header">{year}</div>
            {Object.keys(grouped[year].months)
              .sort(function (a, b) { return Number(b) - Number(a); })
              .map(function (month) {
                var monthPhotos = grouped[year].months[month];
                return (
                  <div key={year + '-' + month}>
                    <div className="timeline-month-header">
                      {MONTHS[Number(month)]}
                      <span className="month-count">{monthPhotos.length}</span>
                    </div>
                    <div className="photo-wall" style={{ columns: cols }}>
                      {monthPhotos.map(function (photo, idx) {
                        return (
                          <PhotoCard key={photo.id} photo={photo}
                            onClick={function () { openLightbox(monthPhotos, idx); }} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        );
      })}

      {grouped.unknown ? (
        <div>
          <div className="timeline-year-header">未知日期</div>
          <div className="photo-wall" style={{ columns: cols }}>
            {grouped.unknown.months['--'].map(function (photo, idx) {
              return (
                <PhotoCard key={photo.id} photo={photo}
                  onClick={function () { openLightbox(grouped.unknown.months['--'], idx); }} />
              );
            })}
          </div>
        </div>
      ) : null}

      {years.length > 3 ? (
        <div className="year-jump">
          {years.map(function (y) {
            return (
              <button key={y} onClick={function () {
                var el = yearRefs.current[y];
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>{y}</button>
            );
          })}
        </div>
      ) : null}

      {lbIdx >= 0 ? (
        <PhotoLightbox photos={lbPhotos} index={lbIdx}
          onClose={function () { setLbIdx(-1); }} />
      ) : null}
    </div>
  );
}

export default TimelineView;


