import { useState } from 'react';
import { usePhotoStore } from '../store/photoStore';

function CorrectionPanel(props) {
  var item = props.item;
  var itemType = props.itemType; // 'residence' or 'trip'
  var onClose = props.onClose;

  var updateResidenceOverride = usePhotoStore(function (s) { return s.updateResidenceOverride; });
  var updateTripOverride = usePhotoStore(function (s) { return s.updateTripOverride; });
  var setViewMode = usePhotoStore(function (s) { return s.setViewMode; });

  var _rn = useState(false), isRenaming = _rn[0], setIsRenaming = _rn[1];
  var _nm = useState(item.displayName || ''), renameValue = _nm[0], setRenameValue = _nm[1];

  if (!item) return null;

  function handleRename() {
    if (!renameValue.trim()) return;
    var override = { name: renameValue.trim() };
    if (itemType === 'residence') {
      updateResidenceOverride(item.id, override);
    } else {
      updateTripOverride(item.id, override);
    }
    setIsRenaming(false);
  }

  function handleIgnore() {
    var override = { ignored: true };
    if (itemType === 'residence') {
      updateResidenceOverride(item.id, override);
    } else {
      updateTripOverride(item.id, override);
    }
    if (onClose) onClose();
  }

  function handlePromote() {
    // Demote from residence to trip
    var override = { ignored: true };
    updateResidenceOverride(item.id, override);
    if (onClose) onClose();
  }

  function handleDemote() {
    // Ignore the trip (effectively demoting it)
    var override = { ignored: true };
    updateTripOverride(item.id, override);
    if (onClose) onClose();
  }

  return (
    <div className="correction-panel">
      <div className="correction-panel-header">
        <span>{itemType === 'residence' ? '居住期' : '旅行'} 操作</span>
        <button className="correction-panel-close" onClick={onClose}>{'\u2715'}</button>
      </div>

      <div className="correction-panel-body">
        <div className="correction-item-name">
          {isRenaming ? (
            <div className="correction-rename-row">
              <input type="text" value={renameValue} onChange={function (e) { setRenameValue(e.target.value); }}
                onKeyDown={function (e) { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                autoFocus />
              <button onClick={handleRename}>{'\u2713'}</button>
              <button onClick={function () { setIsRenaming(false); }}>{'\u2715'}</button>
            </div>
          ) : (
            <div className="correction-item-display" onClick={function () { setIsRenaming(true); setRenameValue(item.displayName || ''); }}>
              {item.displayName || item.id || '(未命名)'}
              <span className="correction-edit-hint">{'\u270E'}</span>
            </div>
          )}
        </div>

        <div className="correction-actions">
          <button className="correction-btn correction-btn-danger" onClick={handleIgnore}>
            {'\u2715'} 忽略此项
          </button>
          {itemType === 'residence' ? (
            <button className="correction-btn" onClick={handlePromote}>
              {'\u2193'} 降为旅行
            </button>
          ) : (
            <button className="correction-btn" onClick={handleDemote}>
              {'\u2191'} 提升为居住期
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CorrectionPanel;
