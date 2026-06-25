var METADATA_FILE = '.locus-metadata.json';
var dirHandle = null;
var desktopDirPath = null;

var EMPTY_LOCUS = { version: 1, residenceOverrides: {}, tripOverrides: {}, heartedPhotos: [] };

var cached = JSON.parse(JSON.stringify(EMPTY_LOCUS));

export function getLocusMetadata() {
  return cached;
}

export function setLocusDirectory(handle) {
  dirHandle = handle || null;
  desktopDirPath = null;
}

export function setLocusDesktopDirectory(path) {
  desktopDirPath = path || null;
  dirHandle = null;
}

/* Merge locus section into an existing metadata object (from metadataStore) */
export function mergeLocusSection(existingMeta) {
  if (!existingMeta) return JSON.parse(JSON.stringify(EMPTY_LOCUS));
  return {
    version: existingMeta.version || 1,
    residenceOverrides: existingMeta.residenceOverrides || {},
    tripOverrides: existingMeta.tripOverrides || {},
    heartedPhotos: existingMeta.heartedPhotos || []
  };
}

/* Read locus metadata from directory, merging with existing metadata if any */
export async function loadLocusMetadata(existingMeta) {
  if (existingMeta) {
    cached = mergeLocusSection(existingMeta);
  } else {
    cached = JSON.parse(JSON.stringify(EMPTY_LOCUS));
  }
  return cached;
}

/* Save locus metadata — merges into full metadata file */
export async function saveLocusMetadata(locusData) {
  cached = locusData || JSON.parse(JSON.stringify(EMPTY_LOCUS));

  if (desktopDirPath) {
    try {
      var desktop = await import('./desktopBridge');
      var existing = await desktop.loadDesktopMetadata(desktopDirPath);
      var merged = Object.assign({}, existing || { version: 1, photos: {} }, {
        residenceOverrides: cached.residenceOverrides,
        tripOverrides: cached.tripOverrides,
        heartedPhotos: cached.heartedPhotos
      });
      // TODO: use tmp-then-rename atomic write (requires backend support)
      await desktop.saveDesktopMetadata(desktopDirPath, merged);
    } catch (e) {
      console.error('[locusStore] Failed to save via desktop bridge:', e);
    }
    return;
  }

  if (!dirHandle) {
    console.warn('[locusStore] No writable directory handle');
    return;
  }

  try {
    // Read existing content first
    var existing = {};
    try {
      var readFile = await dirHandle.getFileHandle(METADATA_FILE);
      var file = await readFile.getFile();
      var text = await file.text();
      existing = JSON.parse(text);
    } catch (e) {
      // File doesn't exist yet
    }

    // Merge in our section
    var merged = Object.assign({}, existing, {
      version: existing.version || 1,
      residenceOverrides: cached.residenceOverrides,
      tripOverrides: cached.tripOverrides,
      heartedPhotos: cached.heartedPhotos
    });

    var content = JSON.stringify(merged, null, 2);
    var tmpFile = METADATA_FILE + ".tmp";

    // 1. Write to temp file first (safe - if this fails, original is untouched)
    var tmpHandle = await dirHandle.getFileHandle(tmpFile, { create: true });
    var tmpWritable = await tmpHandle.createWritable();
    await tmpWritable.write(content);
    await tmpWritable.close();

    // 2. Now safely overwrite the real file
    var fileHandle = await dirHandle.getFileHandle(METADATA_FILE, { create: true });
    var writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();

    // 3. Clean up temp file
    try { await dirHandle.removeEntry(tmpFile); } catch (e) { /* best-effort cleanup */ }
  } catch (e) {
    console.error("[locusStore] Failed to save:", e);
  }
}

export default { getLocusMetadata, loadLocusMetadata, saveLocusMetadata, setLocusDirectory, setLocusDesktopDirectory };
