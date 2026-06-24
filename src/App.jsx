import { useRef } from 'react';
import { usePhotoStore } from './store/photoStore';
import { selectDirectory, scanDirectory } from './services/photoLoader';
import { parseExif } from './services/exifParser';
import { generateThumbnail } from './services/thumbnailer';
import { loadMetadata, applyMetadataOverride, getMetadata } from './services/metadataStore';
import CombinedView from './views/CombinedView';
import StatsPanel from './components/StatsPanel';
import MapView from './views/MapView';
import TimelineView from './views/TimelineView';

var IMG_EXTS = ['.jpg','.jpeg','.png','.heic','.heif','.webp','.bmp','.gif'];

function App() {
  var viewMode = usePhotoStore(function (s) { return s.viewMode; });
  var loading = usePhotoStore(function (s) { return s.loading; });
  var error = usePhotoStore(function (s) { return s.error; });
  var photos = usePhotoStore(function (s) { return s.photos; });
  var setPhotos = usePhotoStore(function (s) { return s.setPhotos; });
  var setLoading = usePhotoStore(function (s) { return s.setLoading; });
  var setError = usePhotoStore(function (s) { return s.setError; });
  var setViewMode = usePhotoStore(function (s) { return s.setViewMode; });
  var addPhotos = usePhotoStore(function (s) { return s.addPhotos; });
  var fileInputRef = useRef(null);
  var dirHandleRef = useRef(null);

  var hasNative = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

  function loadFiles(files) {
    console.log('[App] loadFiles called with', files.length, 'files');
    setLoading(true);
    var parsed = [];
    var remaining = files.length;

    files.forEach(function (file) {
      var dot = file.name.lastIndexOf('.');
      var ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
      if (IMG_EXTS.indexOf(ext) < 0) {
        remaining--;
        if (remaining === 0) finish();
        return;
      }

      file.arrayBuffer().then(function (buffer) {
        var blobUrl = URL.createObjectURL(file);
        var path = file.webkitRelativePath || file.name;
        console.log('[App] parsing EXIF for:', file.name, 'buffer size:', buffer.byteLength);
        return parseExif(buffer).then(function (exif) {
          console.log('[App] EXIF result for', file.name, ':', JSON.stringify({lat: exif ? exif.lat : null, lng: exif ? exif.lng : null, dt: exif ? exif.datetime : null}));
          return generateThumbnail(blobUrl).then(function (thumbUrl) {
            var datetime = (exif && exif.datetime) ? exif.datetime : new Date(file.lastModified);
            var datetimeSource = (exif && exif.datetime) ? 'exif' : 'file';
            var lat = (exif && exif.lat != null) ? exif.lat : null;
            var lng = (exif && exif.lng != null) ? exif.lng : null;
            var photo = {
              id: crypto.randomUUID(),
              name: file.name,
              path: path,
              blobUrl: blobUrl,
              thumbnailUrl: thumbUrl,
              datetime: datetime,
              datetimeSource: datetimeSource,
              originalDatetime: datetime ? datetime.toISOString() : null,
              originalDatetimeSource: datetimeSource,
              lat: lat,
              lng: lng,
              originalLat: lat,
              originalLng: lng,
              originalGeoSource: lat != null && lng != null ? 'exif' : null,
              make: (exif && exif.make) || null,
              model: (exif && exif.model) || null,
              width: (exif && exif.width) || null,
              height: (exif && exif.height) || null
            };
            photo = applyMetadataOverride(photo, getMetadata());
            console.log('[App] photo object for', file.name, ': lat=', photo.lat, 'lng=', photo.lng);
            parsed.push(photo);
          });
        });
      }).catch(function (e) {
        console.error('[App] error loading', file.name, ':', e);
      }).then(function () {
        remaining--;
        if (remaining === 0) finish();
      });
    });

    function finish() {
      console.log('[App] finish: parsed', parsed.length, 'photos');
      parsed.forEach(function(p) { console.log('[App]   ', p.name, 'lat:', p.lat, 'lng:', p.lng); });
      if (parsed.length === 0) {
        setError('未找到支持的图片文件。');
      } else {
        setPhotos(parsed);
        setLoading(false);
      }
    }
  }

  function openFolder() {
    setError(null);
    selectDirectory().then(function (dirHandle) {
      if (!dirHandle) return;
      dirHandleRef.current = dirHandle;
      setLoading(true);
      return loadMetadata(dirHandle).then(function () { return scanDirectory(dirHandle); }).then(function (entries) {
        console.log('[App] scanDirectory found', entries.length, 'entries');
        var promises = entries.map(function (entry) {
          return entry.handle.getFile().then(function (file) {
            if (!file.webkitRelativePath) {
              try { Object.defineProperty(file, 'webkitRelativePath', { value: entry.path, writable: false, configurable: true }); } catch (e) {}
            }
            return file;
          });
        });
        return Promise.all(promises).then(function (files) {
          loadFiles(files);
        });
      });
    }).catch(function (err) {
      setError('文件夹访问失败: ' + (err.message || String(err)));
    });
  }

  function reloadFolder() {
    setError(null);
    var dh = dirHandleRef.current;
    if (!dh) {
      openFolder();
      return;
    }
    setLoading(true);
    var existingPaths = {};
    photos.forEach(function (p) { existingPaths[p.path] = true; });
    scanDirectory(dh).then(function (entries) {
      var newEntries = entries.filter(function (e) { return !existingPaths[e.path]; });
      if (newEntries.length === 0) {
        setLoading(false);
        return;
      }
      var promises = newEntries.map(function (entry) {
        return entry.handle.getFile().then(function (file) {
          if (!file.webkitRelativePath) {
            try { Object.defineProperty(file, 'webkitRelativePath', { value: entry.path, writable: false, configurable: true }); } catch (e) {}
          }
          return file;
        });
      });
      return Promise.all(promises).then(function (files) {
        loadNewFiles(files);
      });
    }).catch(function (err) {
      setError('刷新失败: ' + (err.message || String(err)));
    });
  }

  function loadNewFiles(files) {
    var parsed = [];
    var remaining = files.length;

    files.forEach(function (file) {
      var dot = file.name.lastIndexOf('.');
      var ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
      if (IMG_EXTS.indexOf(ext) < 0) {
        remaining--;
        if (remaining === 0) finishNew();
        return;
      }

      file.arrayBuffer().then(function (buffer) {
        var blobUrl = URL.createObjectURL(file);
        var path = file.webkitRelativePath || file.name;
        console.log('[App-reload] parsing EXIF for:', file.name);
        return parseExif(buffer).then(function (exif) {
          console.log('[App-reload] EXIF result for', file.name, ':', JSON.stringify({lat: exif ? exif.lat : null, lng: exif ? exif.lng : null}));
          return generateThumbnail(blobUrl).then(function (thumbUrl) {
            var datetime = (exif && exif.datetime) ? exif.datetime : new Date(file.lastModified);
            var datetimeSource = (exif && exif.datetime) ? 'exif' : 'file';
            var lat = (exif && exif.lat != null) ? exif.lat : null;
            var lng = (exif && exif.lng != null) ? exif.lng : null;
            var photo = {
              id: crypto.randomUUID(),
              name: file.name,
              path: path,
              blobUrl: blobUrl,
              thumbnailUrl: thumbUrl,
              datetime: datetime,
              datetimeSource: datetimeSource,
              originalDatetime: datetime ? datetime.toISOString() : null,
              originalDatetimeSource: datetimeSource,
              lat: lat,
              lng: lng,
              originalLat: lat,
              originalLng: lng,
              originalGeoSource: lat != null && lng != null ? 'exif' : null,
              make: (exif && exif.make) || null,
              model: (exif && exif.model) || null,
              width: (exif && exif.width) || null,
              height: (exif && exif.height) || null
            };
            photo = applyMetadataOverride(photo, getMetadata());
            console.log('[App-reload] photo object for', file.name, ': lat=', photo.lat, 'lng=', photo.lng);
            parsed.push(photo);
          });
        });
      }).catch(function (e) {
        console.error('[App-reload] error loading', file.name, ':', e);
      }).then(function () {
        remaining--;
        if (remaining === 0) finishNew();
      });
    });

    function finishNew() {
      console.log('[App-reload] finishNew: parsed', parsed.length, 'new photos');
      parsed.forEach(function(p) { console.log('[App-reload]   ', p.name, 'lat:', p.lat, 'lng:', p.lng); });
      if (parsed.length > 0) {
        addPhotos(parsed);
      } else {
        setLoading(false);
      }
    }
  }

  function openFileInput() {
    setError(null);
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function onFilesSelected(e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    loadFiles(files);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>照片相册</h1>
        <div className="view-tabs">
          <button className={viewMode === 'combined' ? 'active' : ''}
            onClick={function () { setViewMode('combined'); }}>地图 + 时间轴</button>
          <button className={viewMode === 'map' ? 'active' : ''}
            onClick={function () { setViewMode('map'); }}>地图</button>
          <button className={viewMode === 'timeline' ? 'active' : ''}
            onClick={function () { setViewMode('timeline'); }}>时间轴</button>
        </div>
        {photos.length > 0 ? <StatsPanel /> : null}
        <input ref={fileInputRef} type="file" webkitdirectory="" multiple accept="image/*"
          style={{ display: 'none' }} onChange={onFilesSelected} />
        <button className="folder-btn" onClick={hasNative ? openFolder : openFileInput} disabled={loading}>
          {loading ? '加载中...' : (hasNative ? '打开文件夹' : '选择照片')}
        </button>
        {photos.length > 0 ? (
          <button className="reload-btn" onClick={reloadFolder} disabled={loading} title="扫描新增图片">&#x21BB;</button>
        ) : null}
      </header>

      {error ? (
        <div className="error-bar">
          {error}
          <button className="error-dismiss" onClick={function () { setError(null); }}>关闭</button>
        </div>
      ) : null}

      {photos.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">&#x1F4C2;</div>
          <p className="empty-state-text">选择一个包含照片的文件夹，即可在地图和时间轴上浏览。</p>
          <button className="empty-choose-btn" onClick={openFolder}>{hasNative ? '选择文件夹' : '选择照片'}</button>
          <p className="browser-hint">
            {hasNative ? '支持 Chrome / Edge 原生文件夹访问。' : '使用传统文件选择器 —— 推荐使用 Chrome / Edge。'}
          </p>
        </div>
      ) : null}

      {photos.length > 0 && viewMode === 'combined' ? <CombinedView /> : null}
      {photos.length > 0 && viewMode === 'map' ? <MapView /> : null}
      {photos.length > 0 && viewMode === 'timeline' ? <TimelineView /> : null}
    </div>
  );
}

export default App;


