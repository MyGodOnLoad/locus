import { useRef, useEffect, useState } from "react";
import { usePhotoStore } from "./store/photoStore";
import { selectDirectory, scanDirectory } from "./services/photoLoader";
import { parseExif } from "./services/exifParser";
import { generateThumbnail } from "./services/thumbnailer";
import { loadMetadata, applyMetadataOverride, getMetadata } from "./services/metadataStore";
import CombinedView from "./views/CombinedView";
import StatsPanel from "./components/StatsPanel";
import MapView from "./views/MapView";
import TimelineView from "./views/TimelineView";

var IMG_EXTS = [".jpg",".jpeg",".png",".heic",".heif",".webp",".bmp",".gif"];

function App() {
  var viewMode = usePhotoStore(function (s) { return s.viewMode; });
  var loading = usePhotoStore(function (s) { return s.loading; });
  var error = usePhotoStore(function (s) { return s.error; });
  var photos = usePhotoStore(function (s) { return s.photos; });
  var setPhotos = usePhotoStore(function (s) { return s.setPhotos; });
  var setLoading = usePhotoStore(function (s) { return s.setLoading; });
  var setError = usePhotoStore(function (s) { return s.setError; });
  var setViewMode = usePhotoStore(function (s) { return s.setViewMode; });

  var theme = usePhotoStore(function (s) { return s.theme; });
  var setTheme = usePhotoStore(function (s) { return s.setTheme; });
  var addPhotos = usePhotoStore(function (s) { return s.addPhotos; });
  var fileInputRef = useRef(null);
  var dirHandleRef = useRef(null);
  var _drag = useState(false); var isDragOver = _drag[0]; var setDragOver = _drag[1];

  var isElectron = typeof window !== "undefined" && window.electronAPI;

  useEffect(function () {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(function () {
    function onKeyDown(e) {
      if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        if (isElectron) { openFolderElectron(); } else { openFolder(); }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return function () { document.removeEventListener("keydown", onKeyDown); };
  }, [isElectron]);


  useEffect(function () {
    if (!isElectron) return;
    window.electronAPI.onMenuOpenFolder(function () { openFolderElectron(); });
    window.electronAPI.onMenuViewMode(function (mode) { setViewMode(mode); });
    window.electronAPI.onMenuToggleTheme(function () { setTheme(theme === "ink" ? "dark" : "ink"); });
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

  var hasNative = typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";

  function makePhotoFromFile(file, exif, thumbUrl) {
    var datetime = (exif && exif.datetime) ? exif.datetime : new Date(file.lastModified);
    var datetimeSource = (exif && exif.datetime) ? "exif" : "file";
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
      originalGeoSource: lat != null && lng != null ? "exif" : null,
      make: (exif && exif.make) || null,
      model: (exif && exif.model) || null,
      width: (exif && exif.width) || null,
      height: (exif && exif.height) || null,
    };
    return applyMetadataOverride(photo, getMetadata());
  }

  function loadFiles(files) {
    console.log("[App] loadFiles called with", files.length, "files");
    setLoading(true);
    var parsed = [];
    var remaining = files.length;

    files.forEach(function (file) {
      var dot = file.name.lastIndexOf(".");
      var ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
      if (IMG_EXTS.indexOf(ext) < 0) {
        remaining--;
        if (remaining === 0) finish();
        return;
      }

      file.arrayBuffer().then(function (buffer) {
        var blobUrl = URL.createObjectURL(file);
        file.blobUrl = blobUrl;
        console.log("[App] parsing EXIF for:", file.name);
        return parseExif(buffer).then(function (exif) {
          return generateThumbnail(blobUrl).then(function (thumbUrl) {
            parsed.push(makePhotoFromFile(file, exif, thumbUrl));
          });
        });
      }).catch(function (e) {
        console.error("[App] error loading", file.name, ":", e);
      }).then(function () {
        remaining--;
        if (remaining === 0) finish();
      });
    });

    function finish() {
      console.log("[App] finish: parsed", parsed.length, "photos");
      if (parsed.length === 0) {
        setError("未找到支持的图片文件。");
      } else {
        setPhotos(parsed);
        setLoading(false);
      }
    }
  }

  function loadFilesElectron(rawFiles) {
    console.log("[App-Electron] loadFilesElectron called with", rawFiles.length, "files");
    setLoading(true);
    var parsed = [];
    var completed = 0;
    var total = rawFiles.length;

    rawFiles.forEach(function (raw) {
      var blob = new Blob([raw.buffer], { type: "image/*" });
      var blobUrl = URL.createObjectURL(blob);
      var file = { name: raw.name, path: raw.path, lastModified: raw.lastModified, blobUrl: blobUrl };

      parseExif(raw.buffer).then(function (exif) {
        return generateThumbnail(blobUrl).then(function (thumbUrl) {
          parsed.push(makePhotoFromFile(file, exif, thumbUrl));
        });
      }).catch(function (e) {
        console.error("[App-Electron] error parsing", raw.name, ":", e);
      }).then(function () {
        completed++;
        if (completed === total) finishElectron();
      });
    });

    setTimeout(function () {
      if (completed < total) finishElectron();
    }, 30000);

    function finishElectron() {
      console.log("[App-Electron] finish: parsed", parsed.length, "photos");
      if (parsed.length === 0) {
        setError("未找到支持的图片文件。");
      } else {
        setPhotos(parsed);
        setLoading(false);
      }
    }
  }

  function openFolderElectron() {
    setError(null);
    console.log("[App] openFolderElectron 被调用，isElectron:", isElectron);
    if (!isElectron) { console.log("[App] 非 Electron 环境，退出"); return; }
    var api = window.electronAPI;
    if (!api || typeof api.openFolder !== "function") {
      console.error("[App] electronAPI 不可用:", typeof api);
      setError("Electron API 不可用，请确认正在使用桌面应用而非浏览器打开。");
      return;
    }
    console.log("[App] 正在调用 electronAPI.openFolder...");
    api.openFolder().then(function (folderPath) {
      console.log("[App] openFolder 返回:", folderPath);
      if (!folderPath) return;
      setLoading(true);
      return loadMetadata(null).then(function () {
        return api.scanFolder(folderPath);
      }).then(function (rawFiles) {
        console.log("[App-Electron] scanFolder 返回", rawFiles.length, "个文件");
        if (!rawFiles || rawFiles.length === 0) {
          setError("该文件夹中没有找到图片文件。");
          setLoading(false);
          return;
        }
        loadFilesElectron(rawFiles);
      });
    }).catch(function (err) {
      console.error("[App] openFolder 错误:", err);
      setError("文件夹访问失败: " + (err.message || String(err)));
    });
  }
  function loadDroppedPaths(filePaths) {
    setError(null);
    if (!isElectron || !filePaths || filePaths.length === 0) return;
    setLoading(true);
    loadMetadata(null).then(function () {
      return window.electronAPI.readPaths(filePaths);
    }).then(function (rawFiles) {
      console.log("[App-Drop] readPaths returned", rawFiles.length, "files");
      if (!rawFiles || rawFiles.length === 0) {
        setError("未找到支持的图片文件。");
        setLoading(false);
        return;
      }
      loadFilesElectron(rawFiles);
    }).catch(function (err) {
      setError("文件读取失败: " + (err.message || String(err)));
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
      return loadMetadata(dirHandle).then(function () { return scanDirectory(dirHandle); }).then(function (entries) {
        console.log("[App] scanDirectory found", entries.length, "entries");
        var promises = entries.map(function (entry) {
          return entry.handle.getFile().then(function (file) {
            if (!file.webkitRelativePath) {
              try { Object.defineProperty(file, "webkitRelativePath", { value: entry.path, writable: false, configurable: true }); } catch (e) {}
            }
            return file;
          });
        });
        return Promise.all(promises).then(function (files) {
          loadFiles(files);
        });
      });
    }).catch(function (err) {
      setError("文件夹访问失败: " + (err.message || String(err)));
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
            try { Object.defineProperty(file, "webkitRelativePath", { value: entry.path, writable: false, configurable: true }); } catch (e) {}
          }
          return file;
        });
      });
      return Promise.all(promises).then(function (files) { loadNewFiles(files); });
    }).catch(function (err) {
      setError("刷新失败: " + (err.message || String(err)));
    });
  }

  function loadNewFiles(files) {
    var parsed = [];
    var remaining = files.length;
    files.forEach(function (file) {
      var dot = file.name.lastIndexOf(".");
      var ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
      if (IMG_EXTS.indexOf(ext) < 0) { remaining--; if (remaining === 0) finishNew(); return; }
      file.arrayBuffer().then(function (buffer) {
        var blobUrl = URL.createObjectURL(file);
        file.blobUrl = blobUrl;
        return parseExif(buffer).then(function (exif) {
          return generateThumbnail(blobUrl).then(function (thumbUrl) {
            parsed.push(makePhotoFromFile(file, exif, thumbUrl));
          });
        });
      }).catch(function (e) { console.error("[App-reload] error:", file.name, e); })
        .then(function () { remaining--; if (remaining === 0) finishNew(); });
    });
    function finishNew() {
      if (parsed.length > 0) { addPhotos(parsed); } else { setLoading(false); }
    }
  }

  function openFileInput() { setError(null); if (fileInputRef.current) fileInputRef.current.click(); }

  function onFilesSelected(e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    loadFiles(files);
  }

  return (
    <div className="app" onDragOver={function (e) { e.preventDefault(); e.stopPropagation(); setDragOver(true); }} onDragLeave={function () { setDragOver(false); }} onDrop={function (e) { e.preventDefault(); e.stopPropagation(); setDragOver(false); if (!isElectron) return; var files = e.dataTransfer.files; if (!files || files.length === 0) return; var paths = []; for (var i = 0; i < files.length; i++) { if (files[i].path) paths.push(files[i].path); } if (paths.length > 0) loadDroppedPaths(paths); }}>
      {isDragOver ? <div className="drag-overlay"><div className="drag-overlay-content">释放以加载照片</div></div> : null}
      <header className="app-header">
        <h1>照片相册</h1>
        <div className="view-tabs">
          <button className={viewMode === "combined" ? "active" : ""}
            onClick={function () { setViewMode("combined"); }}>地图 + 时间轴</button>
          <button className={viewMode === "map" ? "active" : ""}
            onClick={function () { setViewMode("map"); }}>地图</button>
          <button className={viewMode === "timeline" ? "active" : ""}
            onClick={function () { setViewMode("timeline"); }}>时间轴</button>
        </div>
        {photos.length > 0 ? <StatsPanel /> : null}
        <input ref={fileInputRef} type="file" webkitdirectory="" multiple accept="image/*"
          style={{ display: "none" }} onChange={onFilesSelected} />
        <button className="folder-btn" onClick={isElectron ? openFolderElectron : (hasNative ? openFolder : openFileInput)} disabled={loading}>
          {loading ? "加载中..." : "打开文件夹"}
        </button>
        {photos.length > 0 ? (
          <button className="reload-btn" onClick={reloadFolder} disabled={loading} title="扫描新增图片">&#x21BB;</button>
        ) : (
          <button
            className="reload-btn"
            onClick={function () { setTheme(theme === "ink" ? "dark" : "ink"); }}
            title={theme === "ink" ? "切换到画廊风格" : "切换到水墨风格"}
            style={{ fontSize: "15px" }}
          >{theme === "ink" ? "☽" : "☀"}</button>
        )}
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
          <button className="empty-choose-btn" onClick={isElectron ? openFolderElectron : openFolder}>
            {isElectron ? "选择文件夹" : (hasNative ? "选择文件夹" : "选择照片")}
          </button>
          {!isElectron ? (
            <p className="browser-hint">
              {hasNative ? "支持 Chrome / Edge 原生文件夹访问。" : "使用传统文件选择器 —— 推荐使用 Chrome / Edge。"}
            </p>
          ) : null}
        </div>
      ) : null}

      {photos.length > 0 && viewMode === "combined" ? <CombinedView /> : null}
      {photos.length > 0 && viewMode === "map" ? <MapView /> : null}
      {photos.length > 0 && viewMode === "timeline" ? <TimelineView /> : null}
    </div>
  );
}

export default App;
