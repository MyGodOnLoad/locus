import { useState } from 'react';
import { savePhotoOverride, applyMetadataOverride, getMetadata } from '../services/metadataStore';
import { geocodeAddress } from '../services/geocoder';
import { getConfiguredAmapKey } from '../services/amapConfig.js';
import { usePhotoStore } from '../store/photoStore';
import LocationPreviewMap from './LocationPreviewMap';

function pad(n) { return String(n).padStart(2, '0'); }

function dateInputValue(d) {
  if (!d) return '';
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function timeInputValue(d) {
  if (!d) return '';
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function toIsoLocal(date, time) {
  if (!date) return null;
  var t = time || '00:00';
  var d = new Date(date + 'T' + t + ':00');
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function MetadataEditor(props) {
  var photo = props.photo;
  var onClose = props.onClose;
  var updatePhoto = usePhotoStore(function (s) { return s.updatePhoto; });
  var setError = usePhotoStore(function (s) { return s.setError; });

  var _a = useState(photo.datetime ? dateInputValue(photo.datetime) : ''), date = _a[0], setDate = _a[1];
  var _b = useState(photo.datetime ? timeInputValue(photo.datetime) : ''), time = _b[0], setTime = _b[1];
  var _c = useState(photo.lat != null ? String(photo.lat) : ''), lat = _c[0], setLat = _c[1];
  var _d = useState(photo.lng != null ? String(photo.lng) : ''), lng = _d[0], setLng = _d[1];
  var _e = useState(''), address = _e[0], setAddress = _e[1];
  var _g = useState(''), geocodeMsg = _g[0], setGeocodeMsg = _g[1];
  var _h = useState(false), geocoding = _h[0], setGeocoding = _h[1];
  var _i = useState(false), saving = _i[0], setSaving = _i[1];

  var latNum = lat === '' ? null : Number(lat);
  var lngNum = lng === '' ? null : Number(lng);
  var coordsValid = (lat === '' && lng === '') || (
    !isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180
  );

  function handleGeocode() {
    if (geocoding) return;
    setGeocodeMsg('');
    setGeocoding(true);
    geocodeAddress(address, getConfiguredAmapKey()).then(function (result) {
      setLat(String(result.lat));
      setLng(String(result.lng));
      setGeocodeMsg('已定位：' + (result.formattedAddress || address));
      setGeocoding(false);
    }).catch(function (e) {
      setGeocodeMsg(e.message || String(e));
      setGeocoding(false);
    });
  }

  function handleSave() {
    if (!coordsValid || saving) return;
    var datetime = toIsoLocal(date, time);
    var values = {
      datetime: datetime,
      lat: lat === '' && lng === '' ? null : latNum,
      lng: lat === '' && lng === '' ? null : lngNum
    };
    setSaving(true);
    savePhotoOverride(photo, values).then(function () {
      var updated = applyMetadataOverride(photo, getMetadata());
      updatePhoto(photo.path, updated);
      setSaving(false);
      onClose();
    }).catch(function (e) {
      setSaving(false);
      setError('保存校准信息失败: ' + (e.message || String(e)));
    });
  }

  return (
    <div className="metadata-editor-overlay" onClick={function (e) { e.stopPropagation(); onClose(); }}>
      <div className="metadata-editor" onClick={function (e) { e.stopPropagation(); }}>
        <div className="metadata-editor-header">
          <span>校准信息</span>
          <button onClick={onClose}>&#x2715;</button>
        </div>
        <img className="metadata-editor-preview" src={photo.thumbnailUrl} alt={photo.name} />

        <div className="metadata-fieldset">
          <label>拍摄时间</label>
          <div className="metadata-row">
            <input type="date" value={date} onChange={function (e) { setDate(e.target.value); }} />
            <input type="time" value={time} onChange={function (e) { setTime(e.target.value); }} />
          </div>
          <button className="metadata-link" onClick={function () { setDate(''); setTime(''); }}>清除时间</button>
        </div>

        <div className="metadata-fieldset">
          <label>拍摄地点</label>
          <div className="metadata-address-row">
            <input
              type="text"
              placeholder="输入详细地址，例如：天津市西青区天津南站"
              value={address}
              onChange={function (e) { setAddress(e.target.value); }}
            />
            <button onClick={handleGeocode} disabled={geocoding}>{geocoding ? '解析中...' : '解析地址'}</button>
          </div>
          <div className="metadata-coord-row">
            <input type="number" step="0.000001" placeholder="纬度" value={lat} onChange={function (e) { setLat(e.target.value); }} />
            <input type="number" step="0.000001" placeholder="经度" value={lng} onChange={function (e) { setLng(e.target.value); }} />
          </div>
          {!coordsValid ? <div className="metadata-error">纬度范围 -90 到 90，经度范围 -180 到 180。</div> : null}
          {geocodeMsg ? <div className={geocodeMsg.indexOf('已定位') === 0 ? 'metadata-success' : 'metadata-error'}>{geocodeMsg}</div> : null}
          <LocationPreviewMap lat={coordsValid ? latNum : null} lng={coordsValid ? lngNum : null} label={address} />
          <button className="metadata-link" onClick={function () { setLat(''); setLng(''); }}>清除地点</button>
        </div>

        <div className="metadata-source">保存后写入 .locus-metadata.json，原图不会被修改。</div>
        <div className="metadata-actions">
          <button className="metadata-cancel" onClick={onClose}>取消</button>
          <button className="metadata-save" onClick={handleSave} disabled={!coordsValid || saving}>{saving ? '保存中...' : '保存'}</button>
        </div>
      </div>
    </div>
  );
}

export default MetadataEditor;
