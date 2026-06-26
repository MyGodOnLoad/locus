import { useEffect, useState } from 'react';
import MetadataEditor from './MetadataEditor';
import ExifPanel from './ExifPanel';
// remove-next-line from './MetadataEditor';

function PhotoLightbox(props) {
  var photos = props.photos;
  var index = props.index;
  var onClose = props.onClose;

  var _a = useState(index), current = _a[0], setCurrent = _a[1];
  var _b = useState(false), editing = _b[0], setEditing = _b[1];
  var _ex = useState(false), showExif = _ex[0], setShowExif = _ex[1];

  var goPrev = function () {
    setEditing(false);
    setCurrent(function (i) { return i > 0 ? i - 1 : photos.length - 1; });
  };
  var goNext = function () {
    setEditing(false);
    setCurrent(function (i) { return i < photos.length - 1 ? i + 1 : 0; });
  };

  useEffect(function () {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, []);

  var photo = photos[current];
  if (!photo) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={function (e) { e.stopPropagation(); }}>
        <button className="lightbox-nav" onClick={goPrev}>&lsaquo;</button>
        <img className="lightbox-image" src={photo.blobUrl} alt={photo.name} />
        <button className="lightbox-nav" onClick={goNext}>&rsaquo;</button>
      </div>
      <button className="lightbox-close" onClick={onClose}>&times;</button>
      <div className="lightbox-info" onClick={function (e) { e.stopPropagation(); }}>
        <span>
          {photo.name + ' \u00B7 ' + (photo.datetime ? photo.datetime.toLocaleString() : '未知日期')}
          {photo.make ? ' \u00B7 ' + photo.make + (photo.model ? ' ' + photo.model : '') : ''}
          {' \u00B7 ' + (current + 1) + '/' + photos.length}
        </span>
                <button className="lightbox-edit-btn" onClick={function () { setEditing(true); }}>{'\u6821\u51c6\u4fe1\u606f'}</button>
        <button className="lightbox-edit-btn" onClick={function () { setShowExif(!showExif); }}>EXIF</button>
      </div>
      {showExif ? <ExifPanel photo={photo} onClose={function () { setShowExif(false); }} /> : null}
      {editing ? <MetadataEditor photo={photo} onClose={function () { setEditing(false); }} /> : null}
    </div>
  );
}

export default PhotoLightbox;
