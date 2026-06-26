import { useState, useEffect } from 'react';
import { generateTripNarrative, getLLMConfig } from '../services/llmNarrator.js';
import { usePhotoStore } from '../store/photoStore';

function TripNarrative(props) {
  var trip = props.trip;
  var placeNames = usePhotoStore(function (s) { return s.placeNames; });
  var updateTripOverride = usePhotoStore(function (s) { return s.updateTripOverride; });

  var _loading = useState(false), loading = _loading[0], setLoading = _loading[1];
  var _error = useState(''), error = _error[0], setError = _error[1];
  var _narrative = useState(null), narrative = _narrative[0], setNarrative = _narrative[1];

  // Check for cached narrative in trip overrides
  var cachedNarrative = null;
  if (trip.displayName && trip.displayName !== trip.id) {
    cachedNarrative = { name: trip.displayName, description: '' };
  }

  useEffect(function () {
    if (!trip) return;
    var cfg = getLLMConfig();
    if (!cfg.apiKey) {
      setNarrative(cachedNarrative);
      return;
    }

    setLoading(true);
    setError('');
    generateTripNarrative(trip, placeNames, cfg).then(function (result) {
      if (result && result.name) {
        setNarrative(result);
        // Cache in store override so it persists
        updateTripOverride(trip.id, { name: result.name });
      } else {
        setNarrative(cachedNarrative);
      }
      setLoading(false);
    }).catch(function (e) {
      setError(e.message || String(e));
      setNarrative(cachedNarrative);
      setLoading(false);
    });
  }, [trip]);

  if (!trip) return null;

  // Rule-based fallback name
  var fallbackName = trip.displayName && trip.displayName !== trip.id ? trip.displayName : '';

  return (
    <div className="trip-narrative">
      {loading ? (
        <div className="trip-narrative-loading">{'\u751f\u6210\u65c5\u884c\u53d9\u4e8b\u4e2d...'}</div>
      ) : narrative && narrative.description ? (
        <>
          <h3 className="trip-narrative-name">{narrative.name || fallbackName}</h3>
          <p className="trip-narrative-desc">{narrative.description}</p>
        </>
      ) : fallbackName ? (
        <h3 className="trip-narrative-name">{fallbackName}</h3>
      ) : null}
      {error ? <div className="trip-narrative-error">{'\u53d9\u4e8b\u751f\u6210\u5931\u8d25: ' + error}</div> : null}
    </div>
  );
}

export default TripNarrative;
