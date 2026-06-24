function PhotoCard(props) {
  var photo = props.photo;
  var onClick = props.onClick;
  return (
    <div className="photo-card" onClick={onClick}>
      <img src={photo.thumbnailUrl} alt={photo.name} loading="lazy" />
      {photo.lat == null ? <span className="no-gps-badge" title="无GPS">&#x1F4CD;</span> : null}
      {photo.datetimeSource === 'file' ? (
        <div className="photo-card-overlay">{photo.datetime ? photo.datetime.toLocaleDateString() : '无日期'}</div>
      ) : null}
    </div>
  );
}

export default PhotoCard;
