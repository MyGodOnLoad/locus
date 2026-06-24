// electron/main.cjs - Electron main process for photo-album
var path = require("path");
var fs = require("fs");
var { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");

var IMG_EXTS = [".jpg",".jpeg",".png",".heic",".heif",".webp",".bmp",".gif"];
var win = null;
var pendingFolder = null;
var stateFile = path.join(app.getPath("userData"), "window-state.json");
var iconPath = path.join(__dirname, "..", "public", "icon.png");

// ---- Single instance lock ----
var gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", function (_event, argv) {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      // Handle folder path from second instance
      var folder = getFolderFromArgs(argv);
      if (folder && win.webContents) {
        win.webContents.send("open:path", folder);
      }
    }
  });
}

// ---- Extract folder path from command-line args ----
function getFolderFromArgs(argv) {
  if (!argv || argv.length < 2) return null;
  for (var i = 1; i < argv.length; i++) {
    var arg = argv[i];
    if (arg === "." || arg.startsWith("--")) continue;
    try {
      var resolved = path.resolve(arg);
      var stat = fs.statSync(resolved);
      if (stat.isDirectory()) return resolved;
    } catch (e) {}
  }
  return null;
}

// ---- Window state ----
function loadWindowState() {
  try {
    if (fs.existsSync(stateFile)) return JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  } catch (e) {}
  return { width: 1280, height: 860 };
}

function saveWindowState() {
  if (!win || win.isMaximized() || win.isMinimized()) return;
  try {
    var bounds = win.getBounds();
    fs.writeFileSync(stateFile, JSON.stringify({ width: bounds.width, height: bounds.height, x: bounds.x, y: bounds.y }, null, 2));
  } catch (e) {}
}

function createWindow() {
  var saved = loadWindowState();
  win = new BrowserWindow({
    width: saved.width || 1280,
    height: saved.height || 860,
    x: saved.x,
    y: saved.y,
    minWidth: 900,
    minHeight: 600,
    title: "\u7167\u7247\u76F8\u518C",
    backgroundColor: "#F5F3EE",
    icon: iconPath,
    show: false,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once("ready-to-show", function () {
    win.show();
    // Send pending folder path after page loads
    if (pendingFolder) {
      win.webContents.send("open:path", pendingFolder);
      pendingFolder = null;
    }
  });

  win.on("resize", saveWindowState);
  win.on("move", saveWindowState);

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  win.webContents.on("will-navigate", function (e) { e.preventDefault(); });
}

// ---- File scanning ----
function isImageFile(name) {
  var dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return IMG_EXTS.indexOf(name.slice(dot).toLowerCase()) >= 0;
}

function scanDirRecursive(dirPath) {
  var results = [];
  try {
    var entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(scanDirRecursive(fullPath));
      } else if (entry.isFile() && isImageFile(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    console.error("[main] scanDirRecursive error:", e.message);
  }
  return results;
}

function readFilesFromPaths(filePaths) {
  var files = [];
  for (var i = 0; i < filePaths.length; i++) {
    try {
      var stat = fs.statSync(filePaths[i]);
      if (stat.isDirectory()) {
        var subPaths = scanDirRecursive(filePaths[i]);
        for (var j = 0; j < subPaths.length; j++) {
          var buf = fs.readFileSync(subPaths[j]);
          files.push({
            name: path.basename(subPaths[j]),
            path: subPaths[j],
            buffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
            lastModified: fs.statSync(subPaths[j]).mtimeMs,
          });
        }
      } else if (stat.isFile() && isImageFile(filePaths[i])) {
        var buf = fs.readFileSync(filePaths[i]);
        files.push({
          name: path.basename(filePaths[i]),
          path: filePaths[i],
          buffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
          lastModified: stat.mtimeMs,
        });
      }
    } catch (e) {
      console.error("[main] read error:", filePaths[i], e.message);
    }
  }
  return files;
}

// ---- IPC: Dialogs ----
ipcMain.handle("dialog:openFolder", async function () {
  if (!win) return null;
  var result = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
    title: "\u9009\u62E9\u7167\u7247\u6587\u4EF6\u5939",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle("dialog:openFiles", async function () {
  if (!win) return null;
  var result = await dialog.showOpenDialog(win, {
    properties: ["openFile", "multiSelections"],
    title: "\u9009\u62E9\u7167\u7247",
    filters: [{ name: "\u56FE\u7247", extensions: ["jpg","jpeg","png","heic","heif","webp","bmp","gif"] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths;
});

// ---- IPC: File operations ----
ipcMain.handle("fs:scanFolder", async function (_event, folderPath) {
  var filePaths = scanDirRecursive(folderPath);
  return readFilesFromPaths(filePaths);
});

ipcMain.handle("fs:readPaths", async function (_event, filePaths) {
  return readFilesFromPaths(filePaths);
});

// ---- IPC: Window controls ----
ipcMain.handle("win:minimize", function () { if (win) win.minimize(); });
ipcMain.handle("win:maximize", function () {
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.handle("win:close", function () { if (win) win.close(); });
ipcMain.handle("win:isMaximized", function () { return win ? win.isMaximized() : false; });

// ---- IPC: Taskbar progress ----
ipcMain.handle("win:setProgress", function (_event, value) {
  if (win) win.setProgressBar(value);
});

// ---- IPC: Context menu for photos ----
ipcMain.handle("ctx:photo", async function (_event, photoPath) {
  if (!win) return null;
  var menu = Menu.buildFromTemplate([
    { label: "\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u4E2D\u663E\u793A", click: function () {
      require("electron").shell.showItemInFolder(photoPath);
    }},
    { type: "separator" },
    { label: "\u590D\u5236\u6587\u4EF6\u8DEF\u5F84", click: function () {
      require("electron").clipboard.writeText(photoPath);
    }},
  ]);
  menu.popup({ window: win });
});

// ---- App lifecycle ----

// ---- Native menu bar (disabled) ----
app.whenReady().then(function () {
  Menu.setApplicationMenu(null);
  // Check command-line args for folder path
  pendingFolder = getFolderFromArgs(process.argv);
  createWindow();
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
