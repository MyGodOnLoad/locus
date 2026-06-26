import { useState, useMemo } from 'react';
import { usePhotoStore } from '../store/photoStore';

function PhotoWall(props) {
  var photos = props.photos || usePhotoStore(function (s) { return s.photos; });
  var onPhotoClick = props.onPhotoClick;
  var showHeartedOnly = props.showHeartedOnly;
  var toggleHeartedPhoto = usePhotoStore(function (s) { return s.toggleHeartedPhoto; });
  var heartedPhotos = usePhotoStore(function (s) { return s.locusMetadata.heartedPhotos || []; });
  var [columns, setColumns] = useState(4);
  var [search, setSearch] = useState('');

  var filtered = useMemo(function () {
    var result = photos;
    if (showHeartedOnly) {
      result = result.filter(function (p) { return heartedPhotos.indexOf(p.id) >= 0; });
    }
    if (search.trim()) {
      var q = search.toLowerCase();
      result = result.filter(function (p) {
        return p.name.toLowerCase().indexOf(q) >= 0
            || (p.make && p.make.toLowerCase().indexOf(q) >= 0)
            || (p.model && p.model.toLowerCase().indexOf(q) >= 0);
      });
    }
    return result;
  }, [photos, showHeartedOnly, heartedPhotos, search]);

  // Group photos by year, then month, then day
  var groups = useMemo(function () {
    var map = {};
    filtered.forEach(function (photo) {
      var d = photo.datetime ? new Date(photo.datetime) : null;
      var year = d ? d.getFullYear() : '未知';
      var month = d ? d.getMonth() : -1;
      var day = d ? d.getDate() : -1;
      var monthKey = d ? year + '-' + String(month + 1).padStart(2, '0') : '未知';
      var dayKey = d ? monthKey + '-' + String(day).padStart(2, '0') : '未知';
      if (!map[year]) map[year] = {};
      if (!map[year][monthKey]) map[year][monthKey] = {};
      if (!map[year][monthKey][dayKey]) map[year][monthKey][dayKey] = [];
      map[year][monthKey][dayKey].push(photo);
    });
    return map;
  }, [filtered]);

  var sortedYears = Object.keys(groups).sort(function (a, b) {
    if (a === '未知') return 1;
    if (b === '未知') return -1;
    return parseInt(b) - parseInt(a);
  });

  var MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  var totalCount = filtered.length;

  return (
    <div className="photo-wall">
      <div className="photo-wall-toolbar">
        <input
          type="text"
          className="photo-wall-search"
          placeholder={'\u641c\u7d22\u7167\u7247\u540d\u79f0\u3001\u76f8\u673a...'}
          value={search}
          onChange={function (e) { setSearch(e.target.value); }}
        />
        <span className="photo-wall-count">{totalCount} {'\u5f20'}</span>
        <label className="photo-wall-columns-label">
          {'\u5217\u6570:'}
          <input
            type="range"
            min="2" max="8"
            value={columns}
            onChange={function (e) { setColumns(parseInt(e.target.value)); }}
          />
          <span>{columns}</span>
        </label>
      </div>

      {totalCount === 0 ? (
        <div className="empty-state"><p>{'\u6ca1\u6709\u5339\u914d\u7684\u7167\u7247'}</p></div>
      ) : sortedYears.map(function (year) {
        return (
          <div key={year} className="photo-wall-year">
            <h2 className="photo-wall-year-header">{year}</h2>
            {Object.keys(groups[year]).sort().map(function (monthKey) {
              var parts = monthKey.split('-');
              var monthIdx = parseInt(parts[1]) - 1;
              var monthName = monthIdx >= 0 ? MONTH_NAMES[monthIdx] : monthKey;
              return (
                <div key={monthKey} className="photo-wall-month">
                  <h3 className="photo-wall-month-header">{monthName}</h3>
                  {Object.keys(groups[year][monthKey]).sort().map(function (dayKey) {
                    var dayParts = dayKey.split('-');
                    var dayNum = dayParts[dayParts.length - 1];
                    return (
                      <div key={dayKey} className="photo-wall-day">
                        <h4 className="photo-wall-day-header">{dayNum + '\u65e5'}</h4>
                        <div className="photo-wall-grid" style={{ gridTemplateColumns: 'repeat(' + columns + ', 1fr)' }}>
                          {groups[year][monthKey][dayKey].map(function (photo) {
                            return (
                              <div key={photo.id} className="photo-wall-item"
                                onClick={function () { if (onPhotoClick) onPhotoClick(photo); }}>
                                <img src={photo.thumbnailUrl} alt={photo.name} loading="lazy" />
                                <button className="photo-heart" onClick={function (e) { e.stopPropagation(); toggleHeartedPhoto(photo.id || photo.path); }}>{heartedPhotos.indexOf(photo.id || photo.path) >= 0 ? "\u2665" : "\u2661"}</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default PhotoWall;
