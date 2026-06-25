import { useMemo } from 'react';

function TimeCursor(props) {
  var minTime = props.minTime;
  var maxTime = props.maxTime;
  var rangeStart = props.rangeStart;
  var rangeEnd = props.rangeEnd;
  var onChange = props.onChange;

  if (!minTime || !maxTime) return null;

  var totalSpan = maxTime.getTime() - minTime.getTime();
  if (totalSpan <= 0) return null;

  var startPct = ((rangeStart.getTime() - minTime.getTime()) / totalSpan) * 100;
  var endPct = ((rangeEnd.getTime() - maxTime.getTime()) / totalSpan) * 100;
  // endPct is negative (from right), convert to positive from left
  endPct = 100 + endPct;

  var minDate = minTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
  var maxDate = maxTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });

  function handleStartChange(e) {
    var pct = Number(e.target.value);
    var newStart = new Date(minTime.getTime() + (pct / 100) * totalSpan);
    if (newStart < rangeEnd) {
      if (onChange) onChange({ start: newStart, end: rangeEnd });
    }
  }

  function handleEndChange(e) {
    var pct = Number(e.target.value);
    var newEnd = new Date(minTime.getTime() + (pct / 100) * totalSpan);
    if (newEnd > rangeStart) {
      if (onChange) onChange({ start: rangeStart, end: newEnd });
    }
  }

  return (
    <div className="time-cursor">
      <span className="time-cursor-label">{minDate}</span>
      <div className="time-cursor-track">
        <div className="time-cursor-range" style={{ left: startPct + '%', right: (100 - endPct) + '%' }} />
        <input type="range" className="time-cursor-slider" min="0" max="100" value={startPct}
          onChange={handleStartChange} />
        <input type="range" className="time-cursor-slider" min="0" max="100" value={endPct}
          onChange={handleEndChange} />
      </div>
      <span className="time-cursor-label">{maxDate}</span>
    </div>
  );
}

export default TimeCursor;
