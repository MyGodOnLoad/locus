// electron/preload.cjs - Bridge between renderer and main process
var { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Dialogs
  openFolder: function () { return ipcRenderer.invoke("dialog:openFolder"); },
  openFiles: function () { return ipcRenderer.invoke("dialog:openFiles"); },

  // File reading
  scanFolder: function (folderPath) { return ipcRenderer.invoke("fs:scanFolder", folderPath); },
  readPaths: function (filePaths) { return ipcRenderer.invoke("fs:readPaths", filePaths); },

  // Window controls
  minimize: function () { return ipcRenderer.invoke("win:minimize"); },
  maximize: function () { return ipcRenderer.invoke("win:maximize"); },
  close: function () { return ipcRenderer.invoke("win:close"); },
  isMaximized: function () { return ipcRenderer.invoke("win:isMaximized"); },

  // Taskbar progress (0-1, or -1 to hide)
  setProgress: function (value) { return ipcRenderer.invoke("win:setProgress", value); },

  // Context menu
  showPhotoContextMenu: function (photoPath) { return ipcRenderer.invoke("ctx:photo", photoPath); },

  // Listen for events from main process
  onOpenPath: function (callback) {
    ipcRenderer.on("open:path", function (_event, folderPath) { callback(folderPath); });
  },
  onMenuOpenFolder: function (callback) {
    ipcRenderer.on("menu:openFolder", function () { callback(); });
  },
  onMenuViewMode: function (callback) {
    ipcRenderer.on("menu:viewMode", function (_event, mode) { callback(mode); });
  },
  onMenuToggleTheme: function (callback) {
    ipcRenderer.on("menu:toggleTheme", function () { callback(); });
  },

  // Platform
  platform: process.platform,
});
