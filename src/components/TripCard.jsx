import { usePhotoStore } from '../store/photoStore';

function TripCard(props) {
  var trip = props.trip;
  var onClick = props.onClick;
  var placeNames = usePhotoStore ? usePhotoStore(function (s) { return s.placeNames; }) : {};

  if (!trip) return null;

  var name = trip.displayName || trip.id || '';
  var photoCount = trip.photoCount || (trip.photos ? trip.photos.length : 0);
  var coverUrl = trip.coverPhoto ? trip.coverPhoto.thumbnailUrl : (trip.photos && trip.photos.length > 0 ? trip.photos[0].thumbnailUrl : '');

  var startStr = trip.startTime ? trip.startTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  var endStr = trip.endTime ? trip.endTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  var durationDays = 0;
  if (trip.startTime && trip.endTime) {
    durationDays = Math.ceil((trip.endTime.getTime() - trip.startTime.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  var placeLabel = '';
  if (trip.path && trip.path.length > 0) {
    var startKey = trip.path[0].lat.toFixed(4) + ',' + trip.path[0].lng.toFixed(4);
    var endKey = trip.path.length > 1 ? trip.path[trip.path.length - 1].lat.toFixed(4) + ',' + trip.path[trip.path.length - 1].lng.toFixed(4) : '';
    var startName = placeNames[startKey];
    var endName = placeNames[endKey];
    if (startName && endName) {
      placeLabel = (startName.city || startName.district || '') + ' → ' + (endName.city || endName.district || '');
    } else if (startName) {
      placeLabel = startName.city || startName.district || startName.formatted || '';
    } else {
      placeLabel = trip.path[0].lat.toFixed(1) + ', ' + trip.path[0].lng.toFixed(1);
    }
  }

  return (
    <div className="trip-card" onClick={onClick}>
      <div className="trip-card-cover">
        {coverUrl ? <img src={coverUrl} alt="" /> : <div className="trip-card-cover-empty" />}
      </div>
      <div className="trip-card-info">
        <div className="trip-card-name">{name}</div>
        <div className="trip-card-dates">{startStr} {'\u2192'} {endStr}</div>
        <div className="trip-card-meta">
          <span>{durationDays} {'\u5929'}</span>
          <span className="trip-card-sep">{'\u00B7'}</span>
          <span>{photoCount} {'\u5F20\u7167\u7247'}</span>
          {placeLabel ? <span className="trip-card-sep">{'\u00B7'}</span> : null}
          {placeLabel ? <span>{placeLabel}</span> : null}
        </div>
      </div>
    </div>
  );
}

export default TripCard;
