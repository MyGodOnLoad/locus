import { useState } from 'react';

var SPEEDS = [1, 2, 5, 10];

function ReplayController(props) {
  var controller = props.controller;
  var _p = useState(false), playing = _p[0], setPlaying = _p[1];
  var _s = useState(1), speed = _s[0], setSpeed = _s[1];
  var _pr = useState(0), progress = _pr[0], setProgress = _pr[1];

  // Attach callbacks
  if (controller && !controller._uiBound) {
    controller._uiBound = true;
    var origCallbacks = controller._callbacks || {};
    controller._callbacks = {
      onPlayState: function (p) { if (origCallbacks.onPlayState) origCallbacks.onPlayState(p); setPlaying(p); },
      onProgress: function (p) { if (origCallbacks.onProgress) origCallbacks.onProgress(p); setProgress(p); }
    };
  }

  function handlePlayPause() {
    if (!controller) return;
    if (playing) {
      controller.pause();
    } else {
      controller.start();
    }
  }

  function handleSpeedChange(s) {
    setSpeed(s);
    if (controller) controller.setSpeed(s);
  }

  function handleSeek(e) {
    var val = parseFloat(e.target.value);
    setProgress(val);
    if (controller) controller.seek(val);
  }

  function handleExit() {
    if (controller) controller.stop();
    if (props.onExit) props.onExit();
  }

  var progressPct = Math.round(progress * 100);

  return (
    <div className="replay-controller">
      <button className="replay-btn" onClick={handlePlayPause} title={playing ? '\u6682\u505c' : '\u64ad\u653e'}>
        {playing ? '\u23F8' : '\u25B6'}
      </button>

      <div className="replay-speed-group">
        {SPEEDS.map(function (s) {
          return (
            <button key={s} className={'replay-speed-btn' + (s === speed ? ' active' : '')}
              onClick={function () { handleSpeedChange(s); }}>{s}x</button>
          );
        })}
      </div>

      <input
        type="range" min="0" max="1" step="0.001"
        value={progress}
        onChange={handleSeek}
        className="replay-slider"
      />
      <span className="replay-progress-text">{progressPct}%</span>

      <button className="replay-close-btn" onClick={handleExit} title={'\u9000\u51fa\u56de\u653e'}>{'\u2715'}</button>
    </div>
  );
}

export default ReplayController;
