// Replay animation controller — requestAnimationFrame loop
// Drives map movement, polyline drawing, and photo pop-up events

export function createReplayController(trip, map, callbacks) {
  var waypoints = trip.path || [];
  var photos = trip.photos || [];
  if (waypoints.length < 2) return null;

  // Build timeline: interleaved waypoints + photos sorted by time
  var timeline = waypoints.map(function (w, i) {
    return { type: 'waypoint', index: i, lat: w.lat, lng: w.lng, time: w.time || null };
  });
  photos.forEach(function (p, i) {
    if (p.lat != null && p.lng != null) {
      timeline.push({ type: 'photo', index: i, lat: p.lat, lng: p.lng, time: p.datetime, photo: p });
    }
  });
  timeline.sort(function (a, b) {
    var ta = a.time ? new Date(a.time).getTime() : 0;
    var tb = b.time ? new Date(b.time).getTime() : 0;
    return ta - tb;
  });

  var state = {
    playing: false,
    speed: 1,
    progress: 0,       // 0 to 1
    currentWaypointIdx: 0,
    drawnLatLngs: [],
    polyline: null
  };

  var popupActive = {};
  var frameId = null;
  var lastFrameTime = 0;      

  function start() {
    if (state.playing) return;
    // Reset if at end
    if (state.progress >= 1) {
      state.progress = 0;
      state.currentWaypointIdx = 0;
      state.drawnLatLngs = [];
      if (state.polyline) { map.removeLayer(state.polyline); state.polyline = null; }
      // Clear popups
      var container = map.getContainer && map.getContainer();
      if (container) {
        var els = container.querySelectorAll('.replay-photo-popup');
        els.forEach(function (el) { el.remove(); });
      }
    }
    state.playing = true;
    lastFrameTime = performance.now();
    if (callbacks && callbacks.onPlayState) callbacks.onPlayState(true);
    frameId = requestAnimationFrame(tick);
  }

  function pause() {
    state.playing = false;
    if (callbacks && callbacks.onPlayState) callbacks.onPlayState(false);
    if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  }

  function stop() {
    pause();
    state.progress = 1;
    state.currentWaypointIdx = waypoints.length - 1;
    // Draw full line
    if (state.polyline) { map.removeLayer(state.polyline); }
    state.drawnLatLngs = waypoints.map(function (w) { return [w.lat, w.lng]; });
    state.polyline = L.polyline(state.drawnLatLngs, { color: '#3b82f6', weight: 4, opacity: 0.9 }).addTo(map);
    if (callbacks && callbacks.onProgress) callbacks.onProgress(1);
    // Clean popups
    var container = map.getContainer && map.getContainer();
    if (container) {
      var els = container.querySelectorAll('.replay-photo-popup');
      els.forEach(function (el) { el.remove(); });
    }
  }

  function setSpeed(s) { state.speed = s; }
  function seek(pct) {
    pause();
    state.progress = Math.max(0, Math.min(1, pct));
    state.currentWaypointIdx = Math.floor(state.progress * (waypoints.length - 1));
    state.drawnLatLngs = waypoints.slice(0, state.currentWaypointIdx + 1).map(function (w) { return [w.lat, w.lng]; });
    if (state.polyline) { map.removeLayer(state.polyline); }
    if (state.drawnLatLngs.length >= 2) {
      state.polyline = L.polyline(state.drawnLatLngs, { color: '#3b82f6', weight: 4, opacity: 0.9 }).addTo(map);
    }
    if (callbacks && callbacks.onProgress) callbacks.onProgress(state.progress);
  }

  var photoPopupTimers = {};

  function tick(now) {
    if (!state.playing) return;
    var elapsed = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    // Advance progress
    var speedMultiplier = state.speed;
    // Base speed: ~30s for full trip at 1x. Adjust per waypoint interval.
    var totalDuration = 30; // seconds at 1x
    var step = elapsed / totalDuration * speedMultiplier;
    state.progress = Math.min(1, state.progress + step);

    // Update waypoint drawing
    var targetIdx = Math.floor(state.progress * (waypoints.length - 1));
    targetIdx = Math.max(0, Math.min(waypoints.length - 1, targetIdx));

    if (targetIdx > state.currentWaypointIdx) {
      // Update polyline
      if (state.polyline) { map.removeLayer(state.polyline); }
      var sliceLen = Math.min(targetIdx + 1, waypoints.length);
      var newLatLngs = [];
      for (var i = 0; i < sliceLen; i++) {
        newLatLngs.push([waypoints[i].lat, waypoints[i].lng]);
      }
      state.drawnLatLngs = newLatLngs;
      if (newLatLngs.length >= 2) {
        state.polyline = L.polyline(newLatLngs, { color: '#3b82f6', weight: 4, opacity: 0.9 }).addTo(map);
      }
      state.currentWaypointIdx = targetIdx;

      // Pan to current location
      var current = waypoints[targetIdx];
      map.panTo([current.lat, current.lng], { animate: true, duration: 0.3 });

      // Check for photo pop-ups at this waypoint
      for (var j = 0; j < timeline.length; j++) {
        var item = timeline[j];
        if (item.type !== 'photo') continue;
        // Check if this photo should pop up now (within current waypoint range)
        var photoProgress = j / timeline.length;
        if (Math.abs(photoProgress - state.progress) < 0.01 && !photoPopupTimers[item.photo.id]) {
          showPhotoPopup(item.photo, map);
          photoPopupTimers[item.photo.id] = true;
          setTimeout(function (photoId) {
            hidePhotoPopup(photoId, map);
            delete photoPopupTimers[photoId];
          }, 2000, item.photo.id);
        }
      }
    }

    if (callbacks && callbacks.onProgress) callbacks.onProgress(state.progress);

    if (state.progress >= 1) {
      state.progress = 1;
      stop();
      return;
    }

    frameId = requestAnimationFrame(tick);
  }

  function showPhotoPopup(photo, map) {
    var container = map.getContainer && map.getContainer();
    if (!container) return;
    var point = map.latLngToContainerPoint([photo.lat, photo.lng]);
    var el = document.createElement('div');
    el.className = 'replay-photo-popup';
    el.dataset.photoId = photo.id;
    el.style.cssText = 'position:absolute; z-index:1000; pointer-events:none; transform:translate(-50%,-100%);';
    el.style.left = point.x + 'px';
    el.style.top = point.y + 'px';
    el.innerHTML = '<img src="' + photo.thumbnailUrl + '" alt="" style="width:120px; height:auto; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.4); border:2px solid #fff;" />';
    container.appendChild(el);
    // Fade in
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s ease';
    requestAnimationFrame(function () { el.style.opacity = '1'; });
  }

  function hidePhotoPopup(photoId, map) {
    var container = map.getContainer && map.getContainer();
    if (!container) return;
    var el = container.querySelector('[data-photo-id="' + photoId + '"]');
    if (el) {
      el.style.opacity = '0';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }
  }

  function getState() { return state; }

  return { start: start, pause: pause, stop: stop, setSpeed: setSpeed, seek: seek, getState: getState };
}
