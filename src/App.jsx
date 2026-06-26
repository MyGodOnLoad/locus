import { useEffect, useState } from 'react';
import { usePhotoStore } from './store/photoStore';
import { usePhotoLoader } from './hooks/usePhotoLoader';
import ViewRouter from './components/ViewRouter';
import DetectionSettings from './components/DetectionSettings';
import StatsPanel from './components/StatsPanel';

function App() {
  var {
    fileInputRef, isElectron, hasNative,
    openFolder, onFilesSelected, reloadFolder, loadDroppedPaths
  } = usePhotoLoader();

  var viewMode = usePhotoStore(function (s) { return s.viewMode; });
  var loading = usePhotoStore(function (s) { return s.loading; });
  var error = usePhotoStore(function (s) { return s.error; });
  var photos = usePhotoStore(function (s) { return s.photos; });
  var setError = usePhotoStore(function (s) { return s.setError; });
  var setViewMode = usePhotoStore(function (s) { return s.setViewMode; });
  var _ds = useState(false), showSettings = _ds[0], setShowSettings = _ds[1];

  var theme = usePhotoStore(function (s) { return s.theme; });
  var setTheme = usePhotoStore(function (s) { return s.setTheme; });

  var _drag = useState(false); var isDragOver = _drag[0]; var setDragOver = _drag[1];

  useEffect(function () {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(function () {
    function onKeyDown(e) {
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        openFolder();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return function () { document.removeEventListener('keydown', onKeyDown); };
  }, [isElectron]);

  useEffect(function () {
    if (!isElectron) return;
    window.electronAPI.onMenuOpenFolder(function () { openFolder(); });
    window.electronAPI.onMenuViewMode(function (mode) { setViewMode(mode); });
    window.electronAPI.onMenuToggleTheme(function () { setTheme(theme === 'ink' ? 'dark' : 'ink'); });
  }, [isElectron]);

  useEffect(function () {
    if (!isElectron) return;
    window.electronAPI.onOpenPath(function (folderPath) {
      if (folderPath) loadDroppedPaths([folderPath]);
    });
  }, [isElectron]);

  useEffect(function () {
    if (!isElectron) return;
    if (loading) {
      window.electronAPI.setProgress(0.5);
    } else {
      window.electronAPI.setProgress(-1);
    }
  }, [loading, isElectron]);

  return (
    <div
      className="app"
      onDragOver={function (e) { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
      onDragLeave={function () { setDragOver(false); }}
      onDrop={function (e) {
        e.preventDefault(); e.stopPropagation(); setDragOver(false);
        if (!isElectron) return;
        var files = e.dataTransfer.files;
        if (!files || files.length === 0) return;
        var paths = [];
        for (var i = 0; i < files.length; i++) { if (files[i].path) paths.push(files[i].path); }
        if (paths.length > 0) loadDroppedPaths(paths);
      }}
    >
      {isDragOver ? <div className="drag-overlay"><div className="drag-overlay-content">{'\u91ca\u653e\u4ee5\u52a0\u8f7d\u7167\u7247'}</div></div> : null}
      <header className="app-header">
        <h1>{'\u65f6\u5149\u673a'}</h1>
        <div className="view-tabs">
          <button className={viewMode === 'lifemap' ? 'active' : ''}
            onClick={function () { setViewMode('lifemap'); }}>{'\u751f\u547d\u8f68\u8ff9'}</button>
          <button className={viewMode === 'trip-list' ? 'active' : ''}
            onClick={function () { setViewMode('trip-list'); }}>{'\u65c5\u884c'}</button>
          <button className={viewMode === 'story' ? 'active' : ''}
            onClick={function () { setViewMode('story'); }}>{'\u6545\u4e8b'}</button>
          <button className={viewMode === 'combined' ? 'active' : ''}
            onClick={function () { setViewMode('combined'); }}>{'\u5730\u56fe+\u65f6\u95f4\u8f74'}</button>
          <button className={viewMode === 'all-photos' ? 'active' : ''}
            onClick={function () { setViewMode('all-photos'); }}>{'\u5168\u90e8\u7167\u7247'}</button>
        </div>
        {photos.length > 0 ? <StatsPanel /> : null}
        <input ref={fileInputRef} type="file" webkitdirectory="" multiple accept="image/*"
          style={{ display: 'none' }} onChange={onFilesSelected} />
        <button className="folder-btn" onClick={openFolder} disabled={loading}>
          {loading ? '\u52a0\u8f7d\u4e2d...' : '\u6253\u5f00\u6587\u4ef6\u5939'}
        </button>
        {photos.length > 0 ? (
          <>
          <button className="settings-btn" onClick={function () { setShowSettings(true); }} title={'\u68c0\u6d4b\u53c2\u6570'}>{'\u2699'}</button>
          <button className="reload-btn" onClick={reloadFolder} disabled={loading} title={'\u626b\u63cf\u65b0\u589e\u56fe\u7247'}>&#x21BB;</button>
          </>
        ) : (
          <button
            className="reload-btn"
            onClick={function () { setTheme(theme === 'ink' ? 'dark' : 'ink'); }}
            title={theme === 'ink' ? '\u5207\u6362\u5230\u753b\u5eca\u98ce\u683c' : '\u5207\u6362\u5230\u6c34\u58a8\u98ce\u683c'}
            style={{ fontSize: '15px' }}
          >{theme === 'ink' ? '\u263d' : '\u2600'}</button>
        )}
      </header>

      {error ? (
        <div className="error-bar">
          {error}
          <button className="error-dismiss" onClick={function () { setError(null); }}>{'\u5173\u95ed'}</button>
        </div>
      ) : null}

      {photos.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">&#x1F4C2;</div>
          <p className="empty-state-text">{'\u9009\u62e9\u4e00\u4e2a\u5305\u542b\u7167\u7247\u7684\u6587\u4ef6\u5939\uff0c\u5373\u53ef\u5728\u5730\u56fe\u548c\u65f6\u95f4\u8f74\u4e0a\u6d4f\u89c8\u3002'}</p>
          <button className="empty-choose-btn" onClick={openFolder}>
            {isElectron ? '\u9009\u62e9\u6587\u4ef6\u5939' : (hasNative ? '\u9009\u62e9\u6587\u4ef6\u5939' : '\u9009\u62e9\u7167\u7247')}
          </button>
          {!isElectron ? (
            <p className="browser-hint">
              {hasNative ? '\u652f\u6301 Chrome / Edge \u539f\u751f\u6587\u4ef6\u5939\u8bbf\u95ee\u3002' : '\u4f7f\u7528\u4f20\u7edf\u6587\u4ef6\u9009\u62e9\u5668 \u2014\u2014 \u63a8\u8350\u4f7f\u7528 Chrome / Edge\u3002'}
            </p>
          ) : null}
        </div>
      ) : null}

      <ViewRouter viewMode={viewMode} photosLength={photos.length} />

      {showSettings ? <DetectionSettings onClose={function () { setShowSettings(false); }} /> : null}
    </div>
  );
}

export default App;
