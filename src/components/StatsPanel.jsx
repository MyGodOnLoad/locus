import { useMemo, useState } from 'react';
import { usePhotoStore } from '../store/photoStore';

var MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

function dateKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function addDays(d, days) {
  var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + days);
  return x;
}

function startOfWeek(d) {
  return addDays(d, -d.getDay());
}

function buildHeatmap(exifPhotos) {
  var dayCounts = {};
  var dates = [];

  exifPhotos.forEach(function (p) {
    var d = p.datetime;
    if (!d) return;
    var k = dateKey(d);
    dayCounts[k] = (dayCounts[k] || 0) + 1;
    dates.push(d);
  });

  if (dates.length === 0) {
    return { weeks: [], months: [], max: 0, totalDays: 0 };
  }

  dates.sort(function (a, b) { return a - b; });
  var last = dates[dates.length - 1];
  var firstMonth = new Date(last.getFullYear(), last.getMonth() - 11, 1);
  var lastDay = new Date(last.getFullYear(), last.getMonth() + 1, 0);
  var gridStart = startOfWeek(firstMonth);

  var weeks = [];
  var cursor = gridStart;
  var max = 0;
  var totalDays = 0;

  while (cursor <= lastDay) {
    var week = [];
    for (var i = 0; i < 7; i++) {
      var inRange = cursor >= firstMonth && cursor <= lastDay;
      var key = dateKey(cursor);
      var count = inRange ? (dayCounts[key] || 0) : 0;
      if (count > max) max = count;
      if (count > 0) totalDays++;
      week.push({ key: key, date: new Date(cursor), count: count, inRange: inRange });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  var months = [];
  for (var m = 0; m < 12; m++) {
    var monthDate = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + m, 1);
    months.push({ key: monthDate.getFullYear() + '-' + monthDate.getMonth(), label: MONTHS[monthDate.getMonth()] });
  }

  return { weeks: weeks, months: months, max: max, totalDays: totalDays };
}

function heatLevel(count, max) {
  if (count <= 0 || max <= 0) return 0;
  var ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function StatsPanel() {
  var photos = usePhotoStore(function (s) { return s.photos; });
  var setTimeFilter = usePhotoStore(function (s) { return s.setTimeFilter; });
  var setViewMode = usePhotoStore(function (s) { return s.setViewMode; });
  var _a = useState(false), open = _a[0], setOpen = _a[1];

  var stats = useMemo(function () {
    if (photos.length === 0) return null;

    var withGps = photos.filter(function (p) { return p.lat != null; });
    var exifPhotos = photos.filter(function (p) { return p.datetime && p.datetimeSource === 'exif'; });
    var dates = photos
      .filter(function (p) { return p.datetime; })
      .map(function (p) { return p.datetime; });
    var sorted = dates.slice().sort(function (a, b) { return a - b; });

    var locs = {};
    withGps.forEach(function (p) {
      var key = p.lat.toFixed(3) + ',' + p.lng.toFixed(3);
      locs[key] = true;
    });

    var cams = {};
    photos.forEach(function (p) {
      if (p.make || p.model) {
        var k = ((p.make || '') + ' ' + (p.model || '')).trim();
        cams[k] = (cams[k] || 0) + 1;
      }
    });

    return {
      total: photos.length,
      gpsCount: withGps.length,
      gpsPct: photos.length > 0 ? Math.round(withGps.length / photos.length * 100) : 0,
      exifDateCount: exifPhotos.length,
      exifDatePct: photos.length > 0 ? Math.round(exifPhotos.length / photos.length * 100) : 0,
      dateFirst: sorted.length > 0 ? sorted[0] : null,
      dateLast: sorted.length > 1 ? sorted[sorted.length - 1] : null,
      locations: Object.keys(locs).length,
      heatmap: buildHeatmap(exifPhotos),
      cameras: Object.keys(cams).sort(function (a, b) { return cams[b] - cams[a]; }).slice(0, 5).map(function (k) {
        return { name: k, count: cams[k] };
      })
    };
  }, [photos]);

  if (!stats) return null;

  function fmt(d) {
    if (!d) return '--';
    return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
  }

  function selectDay(day) {
    if (!day.inRange || day.count === 0) return;
    setTimeFilter(day.key);
    setViewMode('combined');
    setOpen(false);
  }

  return (
    <div className="stats-container">
      <button className="stats-trigger" onClick={function () { setOpen(!open); }}>
        <span className="stats-number">{stats.total}</span>
        <span className="stats-label">张照片</span>
        <span className="stats-divider">·</span>
        <span className="stats-number">{stats.gpsPct}%</span>
        <span className="stats-label">有GPS</span>
      </button>

      {open ? (
        <div className="stats-overlay" onClick={function () { setOpen(false); }}>
          <div className="stats-panel" onClick={function (e) { e.stopPropagation(); }}>
            <div className="stats-panel-header">
              <span>概览</span>
              <button className="stats-panel-close" onClick={function () { setOpen(false); }}>&#x2715;</button>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">总照片数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.gpsCount}<span className="stat-unit"> / {stats.gpsPct}%</span></div>
                <div className="stat-label">含GPS信息</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.exifDateCount}<span className="stat-unit"> / {stats.exifDatePct}%</span></div>
                <div className="stat-label">含拍摄时间</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.locations}</div>
                <div className="stat-label">拍摄地点</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fmt(stats.dateFirst)}</div>
                <div className="stat-label">最早</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fmt(stats.dateLast)}</div>
                <div className="stat-label">最晚</div>
              </div>
            </div>

            <div className="stats-section heatmap-section">
              <div className="heatmap-title-row">
                <div>
                  <div className="stats-section-title">拍摄热力图</div>
                  <div className="heatmap-subtitle">按 EXIF 拍摄日期统计，点击有照片的日期筛选地图。</div>
                </div>
                <div className="heatmap-total">{stats.exifDateCount}<span>张</span></div>
              </div>
              {stats.heatmap.weeks.length > 0 ? (
                <div className="heatmap-block">
                  <div className="heatmap-ruler">
                    {stats.heatmap.months.map(function (m) { return <span key={m.key}>{m.label}</span>; })}
                  </div>
                  <div className="heatmap-contact-sheet">
                    <div className="heatmap-grid" style={{ gridTemplateColumns: 'repeat(' + stats.heatmap.weeks.length + ', 9px)' }}>
                      {stats.heatmap.weeks.map(function (week, wi) {
                        return (
                          <div className="heatmap-week" key={wi}>
                            {week.map(function (day) {
                              var level = heatLevel(day.count, stats.heatmap.max);
                              return (
                                <button
                                  key={day.key}
                                  className={'heat-cell l' + level + (!day.inRange ? ' out' : '')}
                                  title={day.key + (day.count > 0 ? ' · ' + day.count + ' 张照片' : '')}
                                  onClick={function () { selectDay(day); }}
                                  disabled={!day.inRange || day.count === 0}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="heatmap-footer">
                    <span>{stats.heatmap.totalDays + ' 天有拍摄记录'}</span>
                    <span className="heatmap-legend">
                      <span>少</span><i className="heat-cell l1" /><i className="heat-cell l2" /><i className="heat-cell l3" /><i className="heat-cell l4" /><span>多</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="stats-empty-note">没有可用于统计的拍摄日期。</div>
              )}
            </div>

            {stats.cameras.length > 0 ? (
              <div className="stats-section">
                <div className="stats-section-title">相机型号</div>
                {stats.cameras.map(function (c) {
                  return (
                    <div key={c.name} className="stats-row">
                      <span className="stats-row-name">{c.name}</span>
                      <span className="stats-row-count">{c.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default StatsPanel;


