import { useMemo, useState, useRef } from 'react';
import { usePhotoStore } from '../store/photoStore';
import PhotoCard from '../components/PhotoCard';
import PhotoLightbox from '../components/PhotoLightbox';
import MetadataEditor from '../components/MetadataEditor';

var MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
var COLUMN_OPTIONS = [2, 3, 4, 5];

function AllPhotosView() {
  var photos = usePhotoStore(function (s) { return s.photos; });
  var updatePhoto = usePhotoStore(function (s) { return s.updatePhoto; });

  var _lb = useState([]), lbPhotos = _lb[0], setLbPhotos = _lb[1];
  var _bi = useState(-1), lbIdx = _bi[0], setLbIdx = _bi[1];
  var _co = useState(3), cols = _co[0], setCols = _co[1];
  var _ed = useState(null), editingPhoto = _ed[0], setEditingPhoto = _ed[1];
  var _sr = useState(''), searchText = _sr[0], setSearchText = _sr[1];
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
    var q = searchText.trim().toLowerCase();
    sorted.forEach(function (photo) {
      if (q) {
        var matchName = photo.name && photo.name.toLowerCase().indexOf(q) >= 0;
        var matchMake = photo.make && photo.make.toLowerCase().indexOf(q) >= 0;
        var matchModel = photo.model && photo.model.toLowerCase().indexOf(q) >= 0;
        if (!matchName && !matchMake && !matchModel) return;
      }
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
  }, [sorted, searchText]);

  var years = Object.keys(grouped)
    .filter(function (k) { return k !== 'unknown'; })
    .sort(function (a, b) { return Number(b) - Number(a); });

  function openLightbox(monthPhotos, idx) {
    setLbPhotos(monthPhotos);
    setLbIdx(idx);
  }

  function handleMetadataSave(photo, values) {
    updatePhoto(photo.path, Object.assign({}, photo, {
      datetime: values.datetime ? new Date(values.datetime) : photo.datetime,
      datetimeSource: values.datetime ? 'manual' : photo.datetimeSource,
      lat: values.lat != null ? values.lat : photo.lat,
      lng: values.lng != null ? values.lng : photo.lng,
    }));
    setEditingPhoto(null);
  }

  return (
    <div className="timeline-view">
      <div className="all-photos-toolbar">
        <input
          className="all-photos-search"
          type="text"
          placeholder="搜索文件名、相机型号..."
          value={searchText}
          onChange={function (e) { setSearchText(e.target.value); }}
        />
        <span className="all-photos-count">{photos.length} 张</span>
      </div>

      <div className="zoom-controls">
        <span className="zoom-label">列</span>
        {COLUMN_OPTIONS.map(function (n) {
          return (
            <button key={n} className={'zoom-btn' + (n === cols ? ' active' : '')}
              onClick={function () { setCols(n); }}>{n}</button>
          );
        })}
        <input className="zoom-input" type="number" min="1" max="12" value={cols}
          onChange={function (e) {
            var v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= 1 && v <= 12) setCols(v);
          }} />
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
                          <PhotoCard key={photo.id || photo.path} photo={photo}
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
                <PhotoCard key={photo.id || photo.path} photo={photo}
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

      {editingPhoto ? (
        <MetadataEditor photo={editingPhoto}
          onSave={function (values) { handleMetadataSave(editingPhoto, values); }}
          onClose={function () { setEditingPhoto(null); }} />
      ) : null}
    </div>
  );
}

export default AllPhotosView;
