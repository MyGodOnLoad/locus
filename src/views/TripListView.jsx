import { usePhotoStore } from '../store/photoStore';
import TripCard from '../components/TripCard.jsx';
import { useState, useMemo } from 'react';

var SORT_OPTIONS = [
  { key: 'recency', label: '最近' },
  { key: 'oldest', label: '最早' },
  { key: 'duration-desc', label: '时长↓' },
  { key: 'duration-asc', label: '时长↑' },
  { key: 'photos-desc', label: '照片数↓' },
  { key: 'photos-asc', label: '照片数↑' }
];

function TripListView(props) {
  var getTrips = usePhotoStore(function (s) { return s.getTrips; });
  var setViewMode = usePhotoStore(function (s) { return s.setViewMode; });
  var setSelectedTripId = usePhotoStore(function (s) { return s.setSelectedTripId; });
  var placeNames = usePhotoStore(function (s) { return s.placeNames; });
  // Reactive subscriptions бк trigger re-render when trip data changes
  var _photoCount = usePhotoStore(function (s) { return s.photos.length; });
  var _detectionParams = usePhotoStore(function (s) { return s.detectionParams; });
  var _locusMeta = usePhotoStore(function (s) { return s.locusMetadata; });
  var _sort = useState('recency'), sortBy = _sort[0], setSortBy = _sort[1];
  var _filter = useState(''), filterText = _filter[0], setFilterText = _filter[1];
  var trips = getTrips();

  var filteredTrips = useMemo(function () {
    var result = trips;
    if (filterText.trim()) {
      var q = filterText.trim().toLowerCase();
      result = result.filter(function (t) {
        var nameMatch = (t.placeSummary || t.name || '').toLowerCase().indexOf(q) >= 0;
        if (nameMatch) return true;
        if (t.placeIds) {
          for (var i = 0; i < t.placeIds.length; i++) {
            var pn = placeNames[t.placeIds[i]];
            if (pn && pn.toLowerCase().indexOf(q) >= 0) return true;
          }
        }
        return false;
      });
    }
    result = result.slice().sort(function (a, b) {
      switch (sortBy) {
        case 'oldest': return new Date(a.startDate) - new Date(b.startDate);
        case 'duration-desc': return (b.durationDays || 0) - (a.durationDays || 0);
        case 'duration-asc': return (a.durationDays || 0) - (b.durationDays || 0);
        case 'photos-desc': return (b.photoCount || 0) - (a.photoCount || 0);
        case 'photos-asc': return (a.photoCount || 0) - (b.photoCount || 0);
        default: return new Date(b.startDate) - new Date(a.startDate);
      }
    });
    return result;
  }, [trips, sortBy, filterText, placeNames]);

  function handleTripClick(trip) {
    setSelectedTripId(trip.id);
    setViewMode('trip-detail');
  }

  return (
    <div className="trip-list-view">
      <div className="trip-list-header">
        <button className="back-btn" onClick={function () { setViewMode('lifemap'); }}>
          {'←'} {'地图'}
        </button>
        <h2>{'旅行'} ({filteredTrips.length}{filteredTrips.length !== trips.length ? ' / ' + trips.length : ''})</h2>
        <div className="trip-list-tools">
          <input
            type="text"
            className="trip-filter-input"
            placeholder={'搜索地点名...'}
            value={filterText}
            onChange={function (e) { setFilterText(e.target.value); }}
          />
          <select
            className="trip-sort-select"
            value={sortBy}
            onChange={function (e) { setSortBy(e.target.value); }}
          >
            {SORT_OPTIONS.map(function (opt) {
              return <option key={opt.key} value={opt.key}>{opt.label}</option>;
            })}
          </select>
        </div>
      </div>
      {filteredTrips.length === 0 ? (
        <div className="trip-list-empty">
          <p>{filterText ? '没有匹配的旅行' : '暂无检测到的旅行。加载更多带有 GPS 信息的照片后会自动检测。'}</p>
        </div>
      ) : (
        <div className="trip-list-grid">
          {filteredTrips.map(function (trip) {
            return <TripCard key={trip.id} trip={trip} onClick={function () { handleTripClick(trip); }} />;
          })}
        </div>
      )}
    </div>
  );
}

export default TripListView;
