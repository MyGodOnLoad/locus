import { useRef } from 'react';
import { usePhotoStore } from '../store/photoStore';
import { selectDirectory, scanDirectory } from '../services/photoLoader';
import { parseExif } from '../services/exifParser';
import { generateThumbnail } from '../services/thumbnailer';
import { loadMetadata, applyMetadataOverride, getMetadata } from '../services/metadataStore';
import { loadLocusMetadata } from '../services/locusStore';

var IMG_EXTS = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.bmp', '.gif'];

function makePhotoFromFile(file, exif, thumbUrl) {
  var datetime = (exif && exif.datetime) ? exif.datetime : new Date(file.lastModified);
  var datetimeSource = (exif && exif.datetime) ? 'exif' : 'file';
  var lat = (exif && exif.lat != null) ? exif.lat : null;
  var lng = (exif && exif.lng != null) ? exif.lng : null;
  var photo = {
    id: crypto.randomUUID(),
    name: file.name,
    path: file.path || file.webkitRelativePath || file.name,
    blobUrl: file.blobUrl,
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
    height: (exif && exif.height) || null,
    orientation: (exif && exif.orientation) || 1,
    aperture: (exif && exif.aperture) || null,
    shutterSpeed: (exif && exif.shutterSpeed) || null,
    iso: (exif && exif.iso) || null,
    focalLength: (exif && exif.focalLength) || null,
    flash: (exif && exif.flash) || null,
    altitude: (exif && exif.altitude) || null,
  };
  return applyMetadataOverride(photo, getMetadata());
}

export function usePhotoLoader() {
  var photos = usePhotoStore(function (s) { return s.photos; });
  var setPhotos = usePhotoStore(function (s) { return s.setPhotos; });
  var setLoading = usePhotoStore(function (s) { return s.setLoading; });
  var setError = usePhotoStore(function (s) { return s.setError; });
  var addPhotos = usePhotoStore(function (s) { return s.addPhotos; });
  var fileInputRef = useRef(null);
  var dirHandleRef = useRef(null);

  var isElectron = typeof window !== 'undefined' && window.electronAPI;
  var hasNative = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

  function loadFiles(files) {
    console.log('[usePhotoLoader] loadFiles called with', files.length, 'files');
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
        file.blobUrl = blobUrl;
        return parseExif(buffer).then(function (exif) {
          return generateThumbnail(blobUrl).then(function (thumbUrl) {
            parsed.push(makePhotoFromFile(file, exif, thumbUrl));
          });
        });
      }).catch(function (e) {
        console.error('[usePhotoLoader] error loading', file.name, ':', e);
      }).then(function () {
        remaining--;
        if (remaining === 0) finish();
      });
    });

    function finish() {
      console.log('[usePhotoLoader] finish: parsed', parsed.length, 'photos');
      if (parsed.length === 0) {
        setError('\u672a\u627e\u5230\u652f\u6301\u7684\u56fe\u7247\u6587\u4ef6\u3002');
      } else {
        setPhotos(parsed);
      }
    }
  }

  function loadFilesElectron(rawFiles) {
    console.log('[usePhotoLoader] loadFilesElectron called with', rawFiles.length, 'files');
    setLoading(true);
    var parsed = [];
    var completed = 0;
    var total = rawFiles.length;

    rawFiles.forEach(function (raw) {
      var blob = new Blob([raw.buffer], { type: 'image/*' });
      var blobUrl = URL.createObjectURL(blob);
      var file = { name: raw.name, path: raw.path, lastModified: raw.lastModified, blobUrl: blobUrl };

      parseExif(raw.buffer).then(function (exif) {
        return generateThumbnail(blobUrl).then(function (thumbUrl) {
          parsed.push(makePhotoFromFile(file, exif, thumbUrl));
        });
      }).catch(function (e) {
        console.error('[usePhotoLoader] error parsing', raw.name, ':', e);
      }).then(function () {
        completed++;
        if (completed === total) finishElectron();
      });
    });

    setTimeout(function () {
      if (completed < total) finishElectron();
    }, 30000);

    function finishElectron() {
      console.log('[usePhotoLoader] finish: parsed', parsed.length, 'photos');
      if (parsed.length === 0) {
        setError('\u672a\u627e\u5230\u652f\u6301\u7684\u56fe\u7247\u6587\u4ef6\u3002');
      } else {
        setPhotos(parsed);
      }
    }
  }

  function openFolderElectron() {
    setError(null);
    if (!isElectron) return;
    var api = window.electronAPI;
    if (!api || typeof api.openFolder !== 'function') {
      setError('Electron API \u4e0d\u53ef\u7528\uff0c\u8bf7\u786e\u8ba4\u6b63\u5728\u4f7f\u7528\u684c\u9762\u5e94\u7528\u800c\u975e\u6d4f\u89c8\u5668\u6253\u5f00\u3002');
      return;
    }
    api.openFolder().then(function (folderPath) {
      if (!folderPath) return;
      setLoading(true);
      return loadMetadata(null).then(function (meta) {
        loadLocusMetadata(meta);
        return api.scanFolder(folderPath);
      }).then(function (rawFiles) {
        if (!rawFiles || rawFiles.length === 0) {
          setError('\u8be5\u6587\u4ef6\u5939\u4e2d\u6ca1\u6709\u627e\u5230\u56fe\u7247\u6587\u4ef6\u3002');
          setLoading(false);
          return;
        }
        loadFilesElectron(rawFiles);
      });
    }).catch(function (err) {
      setError('\u6587\u4ef6\u5939\u8bbf\u95ee\u5931\u8d25: ' + (err.message || String(err)));
    });
  }

  function loadDroppedPaths(filePaths) {
    setError(null);
    if (!isElectron || !filePaths || filePaths.length === 0) return;
    setLoading(true);
    loadMetadata(null).then(function (meta) {
      loadLocusMetadata(meta);
      return window.electronAPI.readPaths(filePaths);
    }).then(function (rawFiles) {
      if (!rawFiles || rawFiles.length === 0) {
        setError('\u672a\u627e\u5230\u652f\u6301\u7684\u56fe\u7247\u6587\u4ef6\u3002');
        setLoading(false);
        return;
      }
      loadFilesElectron(rawFiles);
    }).catch(function (err) {
      setError('\u6587\u4ef6\u8bfb\u53d6\u5931\u8d25: ' + (err.message || String(err)));
    });
  }

  function openFolder() {
    if (isElectron) {
      openFolderElectron();
      return;
    }
    setError(null);
    selectDirectory().then(function (dirHandle) {
      if (!dirHandle) return;
      dirHandleRef.current = dirHandle;
      setLoading(true);
      return loadMetadata(dirHandle).then(function (meta) {
        loadLocusMetadata(meta);
        return scanDirectory(dirHandle);
      }).then(function (entries) {
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
      setError('\u6587\u4ef6\u5939\u8bbf\u95ee\u5931\u8d25: ' + (err.message || String(err)));
    });
  }

  function reloadFolder() {
    if (isElectron) {
      openFolderElectron();
      return;
    }
    setError(null);
    var dh = dirHandleRef.current;
    if (!dh) { openFolder(); return; }
    setLoading(true);
    var existingPaths = {};
    photos.forEach(function (p) { existingPaths[p.path] = true; });
    scanDirectory(dh).then(function (entries) {
      var newEntries = entries.filter(function (e) { return !existingPaths[e.path]; });
      if (newEntries.length === 0) { setLoading(false); return; }
      var promises = newEntries.map(function (entry) {
        return entry.handle.getFile().then(function (file) {
          if (!file.webkitRelativePath) {
            try { Object.defineProperty(file, 'webkitRelativePath', { value: entry.path, writable: false, configurable: true }); } catch (e) {}
          }
          return file;
        });
      });
      return Promise.all(promises).then(function (files) { loadNewFiles(files); });
    }).catch(function (err) {
      setError('\u5237\u65b0\u5931\u8d25: ' + (err.message || String(err)));
    });
  }

  function loadNewFiles(files) {
    var parsed = [];
    var remaining = files.length;
    files.forEach(function (file) {
      var dot = file.name.lastIndexOf('.');
      var ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
      if (IMG_EXTS.indexOf(ext) < 0) { remaining--; if (remaining === 0) finishNew(); return; }
      file.arrayBuffer().then(function (buffer) {
        var blobUrl = URL.createObjectURL(file);
        file.blobUrl = blobUrl;
        return parseExif(buffer).then(function (exif) {
          return generateThumbnail(blobUrl).then(function (thumbUrl) {
            parsed.push(makePhotoFromFile(file, exif, thumbUrl));
          });
        });
      }).catch(function (e) { console.error('[usePhotoLoader] error:', file.name, e); })
        .then(function () { remaining--; if (remaining === 0) finishNew(); });
    });
    function finishNew() {
      if (parsed.length > 0) { addPhotos(parsed); } else { setLoading(false); }
    }
  }

  function openFileInput() { setError(null); if (fileInputRef.current) fileInputRef.current.click(); }

  function onFilesSelected(e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    loadFiles(files);
  }

  return {
    fileInputRef: fileInputRef,
    isElectron: isElectron,
    hasNative: hasNative,
    openFolder: isElectron ? openFolderElectron : (hasNative ? openFolder : openFileInput),
    onFilesSelected: onFilesSelected,
    reloadFolder: reloadFolder,
    loadDroppedPaths: loadDroppedPaths,
    openFolderElectron: openFolderElectron,
  };
}
