var METERING_LABELS = {
  0: '\u672a\u77e5', 1: '\u5e73\u5747\u6d4b\u5149', 2: '\u4e2d\u592e\u91cd\u70b9\u6d4b\u5149',
  3: '\u70b9\u6d4b\u5149', 4: '\u591a\u533a\u8bc4\u4ef7', 5: '\u6a21\u5f0f',
  6: '\u90e8\u5206\u6d4b\u5149', 255: '\u5176\u4ed6'
};
var EXPOSURE_LABELS = {
  0: '\u672a\u77e5', 1: '\u624b\u52a8', 2: '\u7a0b\u5e8f\u81ea\u52a8',
  3: '\u5149\u5708\u4f18\u5148', 4: '\u5feb\u95e8\u4f18\u5148',
  5: '\u521b\u610f\u7a0b\u5e8f', 6: '\u52a8\u4f53\u7a0b\u5e8f',
  7: '\u98ce\u666f\u6a21\u5f0f', 8: '\u5feb\u901f\u5feb\u95e8'
};
var FLASH_LABELS = {
  0: '\u672a\u95ea\u5149', 1: '\u95ea\u5149', 5: '\u95ea\u5149(\u672a\u68c0\u6d4b\u5230\u8fd4\u5149)',
  7: '\u95ea\u5149(\u68c0\u6d4b\u5230\u8fd4\u5149)', 9: '\u5f3a\u5236\u95ea\u5149',
  16: '\u5173\u95ed', 24: '\u81ea\u52a8', 25: '\u81ea\u52a8', 65: '\u7ea2\u773c\u51cf\u5c11'
};

function formatShutter(ss) {
  if (ss == null) return null;
  var v = typeof ss === 'number' ? ss : (Array.isArray(ss) ? ss[0] / ss[1] : parseFloat(ss));
  if (isNaN(v)) return null;
  if (v >= 1) return String(Math.round(v * 10) / 10) + 's';
  return '1/' + Math.round(1 / v) + 's';
}

function formatAperture(ap) {
  if (ap == null) return null;
  var v = typeof ap === 'number' ? ap : parseFloat(ap);
  return 'f/' + (isNaN(v) ? String(ap) : String(Math.round(v * 10) / 10));
}

function formatFocalLength(fl) {
  if (fl == null) return null;
  return String(fl) + 'mm';
}

function field(label, value, suffix) {
  if (value == null || value === '') return null;
  return { label: label, value: String(value) + (suffix || '') };
}

function ExifPanel(props) {
  var photo = props.photo;
  var onClose = props.onClose;

  if (!photo) return null;

  var apertureStr = formatAperture(photo.aperture);
  var shutterStr = formatShutter(photo.shutterSpeed);
  var focalStr = formatFocalLength(photo.focalLength);

  var rows = [
    field('\u5149\u5708', apertureStr),
    field('\u5feb\u95e8\u901f\u5ea6', shutterStr),
    field('ISO', photo.iso),
    field('\u7126\u8ddd', focalStr),
    field('35mm\u7b49\u6548', photo.focalLength35mm, 'mm'),
    field('\u95ea\u5149\u706f', FLASH_LABELS[photo.flash] || (photo.flash != null ? '\u5df2\u89e6\u53d1' : null)),
    field('\u66dd\u5149\u8865\u507f', photo.exposureBias, ' EV'),
    field('\u6d4b\u5149\u6a21\u5f0f', METERING_LABELS[photo.meteringMode] || photo.meteringMode),
    field('\u62cd\u6444\u7a0b\u5e8f', EXPOSURE_LABELS[photo.exposureProgram] || photo.exposureProgram),
    field('\u955c\u5934', photo.lensModel),
    field('GPS \u6d77\u62d4', photo.altitude, 'm'),
    field('\u5750\u6807\u6765\u6e90', photo.originalGeoSource === 'exif' ? 'EXIF' : (photo.originalGeoSource || '\u65e0')),
  ].filter(Boolean);

  return (
    <div className="exif-panel-overlay" onClick={onClose}>
      <div className="exif-panel" onClick={function (e) { e.stopPropagation(); }}>
        <div className="exif-panel-header">
          <h3>EXIF {'\u8be6\u60c5'}</h3>
          <button className="exif-panel-close" onClick={onClose}>{'\u2715'}</button>
        </div>
        <div className="exif-panel-sections">
          <div className="exif-section">
            <h4 className="exif-section-title">{'\u62cd\u6444\u53c2\u6570'}</h4>
            <table className="exif-table">
              <tbody>
                {rows.map(function (r) {
                  return (
                    <tr key={r.label}>
                      <td className="exif-label">{r.label}</td>
                      <td className="exif-value">{r.value || '\u2014'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="exif-section">
            <h4 className="exif-section-title">{'\u8bbe\u5907\u4fe1\u606f'}</h4>
            <table className="exif-table">
              <tbody>
                <tr><td className="exif-label">{'\u76f8\u673a'}</td><td className="exif-value">{photo.make || '\u2014'} {photo.model || ''}</td></tr>
                <tr><td className="exif-label">{'\u6587\u4ef6\u4fe1\u606f'}</td><td className="exif-value">{photo.name}</td></tr>
                <tr><td className="exif-label">{'\u5c3a\u5bf8'}</td><td className="exif-value">{(photo.width && photo.height) ? photo.width + ' \u00d7 ' + photo.height : '\u2014'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExifPanel;
