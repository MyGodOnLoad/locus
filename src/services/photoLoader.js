var IMG_EXTS = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.bmp', '.gif'];

export async function selectDirectory() {
  try { return await window.showDirectoryPicker(); }
  catch (err) { if (err.name === 'AbortError') return null; throw err; }
}

export async function scanDirectory(dirHandle) {
  var files = [];
  await walk(dirHandle, '', files);
  return files;
}

async function walk(dirHandle, path, files) {
  for await (var entry of dirHandle.entries()) {
    var name = entry[0], handle = entry[1];
    if (handle.kind === 'file') {
      var dot = name.lastIndexOf('.');
      if (dot >= 0 && IMG_EXTS.indexOf(name.slice(dot).toLowerCase()) >= 0) {
        files.push({ name: name, path: path + name, handle: handle });
      }
    } else if (handle.kind === 'directory') {
      await walk(handle, path + name + '/', files);
    }
  }
}

export async function readFileData(entry) {
  var file = await entry.handle.getFile();
  var buffer = await file.arrayBuffer();
  var blobUrl = URL.createObjectURL(file);
  return { buffer: buffer, blobUrl: blobUrl, file: file };
}

