import { usePhotoStore } from '../store/photoStore';

var FIELD_DEFS = [
  { group: '居住期检测', key: 'spatial.clusterEps', label: '聚类半径 (km)', min: 0.1, max: 5.0, step: 0.1, unit: 'km' },
  { group: '居住期检测', key: 'spatial.minClusterPts', label: '最少聚类照片数', min: 2, max: 20, step: 1, unit: '张' },
  { group: '居住期检测', key: 'residence.minDuration', label: '最短居住天数', min: 14, max: 365, step: 1, unit: '天' },
  { group: '居住期检测', key: 'residence.minPhotosPerMonth', label: '月均最少照片数', min: 1, max: 20, step: 1, unit: '张/月' },
  { group: '旅行检测', key: 'excursion.maxGapHours', label: '出行间隙合并 (小时)', min: 4, max: 168, step: 1, unit: 'h' },
  { group: '旅行检测', key: 'excursion.minPhotos', label: '最少旅行照片数', min: 2, max: 20, step: 1, unit: '张' },
  { group: '事件检测', key: 'event.densityThreshold', label: '事件密度阈值', min: 5, max: 100, step: 1, unit: '张/天' },
];

function getNested(obj, path) {
  var parts = path.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length; i++) { cur = cur[parts[i]]; }
  return cur;
}

function setNested(obj, path, value) {
  var parts = path.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length - 1; i++) { cur = cur[parts[i]]; }
  cur[parts[parts.length - 1]] = value;
}

function DetectionSettings(props) {
  var onClose = props.onClose;
  var params = usePhotoStore(function (s) { return s.detectionParams; });
  var setDetectionParams = usePhotoStore(function (s) { return s.setDetectionParams; });

  var groups = {};
  FIELD_DEFS.forEach(function (f) {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push(f);
  });

  function handleChange(key, value) {
    var next = JSON.parse(JSON.stringify(params));
    setNested(next, key, value);
    setDetectionParams(next);
  }

  function handleReset() {
    var defaults = {
      spatial: { clusterEps: 0.5, minClusterPts: 5 },
      residence: { minDuration: 60, minPhotosPerMonth: 3 },
      excursion: { maxGapHours: 48, minPhotos: 3 },
      event: { densityThreshold: 20 }
    };
    setDetectionParams(defaults);
  }

  return (
    <div className="detection-settings-overlay" onClick={function (e) { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="detection-settings">
        <div className="detection-settings-header">
          <h3>检测参数设置</h3>
          <button className="detection-settings-close" onClick={onClose}>{'\u2715'}</button>
        </div>
        <div className="detection-settings-body">
          <p className="detection-settings-hint">调整参数后即时生效。修改幅度过大可能导致居住期和旅行检测结果剧烈变化。</p>
          {Object.keys(groups).map(function (groupName) {
            return (
              <div key={groupName} className="detection-settings-group">
                <div className="detection-settings-group-title">{groupName}</div>
                {groups[groupName].map(function (field) {
                  var value = getNested(params, field.key);
                  return (
                    <div key={field.key} className="detection-field">
                      <div className="detection-field-header">
                        <label className="detection-field-label">{field.label}</label>
                        <span className="detection-field-value">{value} {field.unit}</span>
                      </div>
                      <div className="detection-field-row">
                        <input type="range" min={field.min} max={field.max} step={field.step}
                          value={value} className="detection-field-slider"
                          onChange={function (e) { handleChange(field.key, Number(e.target.value)); }} />
                        <input type="number" min={field.min} max={field.max} step={field.step}
                          value={value} className="detection-field-input"
                          onChange={function (e) {
                            var v = Number(e.target.value);
                            if (!isNaN(v)) handleChange(field.key, v);
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="detection-settings-footer">
          <button className="detection-settings-reset" onClick={handleReset}>恢复默认</button>
          <button className="detection-settings-done" onClick={onClose}>完成</button>
        </div>
      </div>
    </div>
  );
}

export default DetectionSettings;
