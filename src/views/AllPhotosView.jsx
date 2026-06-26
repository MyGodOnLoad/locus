import { useState } from 'react';
import { usePhotoStore } from '../store/photoStore';
import PhotoWall from '../components/PhotoWall';
import PhotoLightbox from '../components/PhotoLightbox';
import MetadataEditor from '../components/MetadataEditor';

function AllPhotosView() {
  var photos = usePhotoStore(function (s) { return s.photos; });
  var updatePhoto = usePhotoStore(function (s) { return s.updatePhoto; });
  var heartedPhotos = usePhotoStore(function (s) { return s.locusMetadata.heartedPhotos || []; });

  var _lb = useState([]), lbPhotos = _lb[0], setLbPhotos = _lb[1];
  var _bi = useState(-1), lbIdx = _bi[0], setLbIdx = _bi[1];
  var _ed = useState(null), editingPhoto = _ed[0], setEditingPhoto = _ed[1];
  var _hf = useState(false), heartedOnly = _hf[0], setHeartedOnly = _hf[1];

  function openLightbox(photo) {
    var sorted = photos.slice().sort(function (a, b) {
      var da = a.datetime ? a.datetime.getTime() : 0;
      var db = b.datetime ? b.datetime.getTime() : 0;
      return db - da;
    });
    var idx = sorted.findIndex(function (p) { return p.id === photo.id; });
    setLbPhotos(sorted);
    setLbIdx(idx >= 0 ? idx : 0);
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
    <div className="all-photos-view">
      <div className="all-photos-toolbar">
        <button
          className={'photo-heart-filter' + (heartedOnly ? ' active' : '')}
          onClick={function () { setHeartedOnly(!heartedOnly); }}
          title={heartedOnly ? '\u663e\u793a\u5168\u90e8' : '\u4ec5\u663e\u793a\u5fc3\u6807'}
        >{heartedOnly ? '\u2665' : '\u2661'} {heartedOnly ? '\u5fc3\u6807\u4e2d' : '\u5fc3\u6807'}</button>
      </div>

      <PhotoWall
        photos={photos}
        showHeartedOnly={heartedOnly}
        onPhotoClick={openLightbox}
      />

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