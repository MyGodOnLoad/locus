import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

export function isDesktopApp() {
  return typeof window !== 'undefined' && window.__TAURI_INTERNALS__ != null;
}

export async function selectDesktopDirectory() {
  if (!isDesktopApp()) return null;
  var selected = await open({ directory: true, multiple: false, title: '选择照片文件夹' });
  return selected || null;
}

export async function scanDesktopDirectory(dirPath) {
  return await invoke('scan_photo_directory', { dirPath: dirPath });
}

export async function readDesktopFile(entry) {
  var bytes = await invoke('read_photo_file', { path: entry.fullPath });
  var blob = new Blob([new Uint8Array(bytes)], { type: mimeFromName(entry.name) });
  var file = new File([blob], entry.name, { type: blob.type, lastModified: entry.modified || Date.now() });
  try { Object.defineProperty(file, 'webkitRelativePath', { value: entry.path, writable: false, configurable: true }); } catch (e) {}
  return file;
}

export async function loadDesktopMetadata(dirPath) {
  var text = await invoke('load_metadata_file', { dirPath: dirPath });
  if (!text) return { version: 1, photos: {} };
  try {
    var parsed = JSON.parse(text);
    return parsed && parsed.photos ? { version: parsed.version || 1, photos: parsed.photos || {} } : { version: 1, photos: {} };
  } catch (e) {
    return { version: 1, photos: {} };
  }
}

export async function saveDesktopMetadata(dirPath, metadata) {
  await invoke('save_metadata_file', { dirPath: dirPath, contents: JSON.stringify(metadata, null, 2) });
}

function mimeFromName(name) {
  var lower = String(name || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}
