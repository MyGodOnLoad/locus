import { useMemo } from 'react';
import { usePhotoStore } from '../store/photoStore';
import { generateStories } from '../services/storyEngine';
import StoryCard from '../components/StoryCard';

function StoryView() {
  var photos = usePhotoStore(function (s) { return s.photos; });
  var getResidenceData = usePhotoStore(function (s) { return s.getResidenceData; });
  var getTrips = usePhotoStore(function (s) { return s.getTrips; });
  var setViewMode = usePhotoStore(function (s) { return s.setViewMode; });
  var setSelectedTripId = usePhotoStore(function (s) { return s.setSelectedTripId; });

  var residenceData = getResidenceData ? getResidenceData() : {};
  var residences = residenceData.residences || [];
  var trips = getTrips ? getTrips() : [];
  var events = residenceData.events || [];

  var stories = useMemo(function () {
    return generateStories(photos, residences, trips, events);
  }, [photos, residences, trips, events]);

  function handleStoryClick(story) {
    if (!story) return;
    if (story.targetType === 'trip' && story.targetId) {
      setSelectedTripId(story.targetId);
      setViewMode('trip-detail');
    } else if (story.targetType === 'residence') {
      setViewMode('lifemap');
    } else {
      setViewMode('all-photos');
    }
  }

  if (photos.length === 0) {
    return <div className="story-view"><div className="empty-state"><p>{'\u6682\u65E0\u7167\u7247\u6570\u636E'}</p></div></div>;
  }

  if (stories.length === 0) {
    return (
      <div className="story-view">
        <div className="empty-state">
          <div className="empty-state-icon">{'\uD83D\uDCD6'}</div>
          <p>{'\u6570\u636E\u8FD8\u4E0D\u591F\u751F\u6210\u6545\u4E8B'}</p>
          <p className="empty-state-hint">{'\u5F53\u7167\u7247\u8D85\u8FC7 50 \u5F20\u4E14\u5305\u542B\u65C5\u884C\u6216\u5C45\u4F4F\u671F\u65F6\uFF0C\u6545\u4E8B\u4F1A\u81EA\u52A8\u751F\u6210\u3002'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="story-view">
      <div className="story-view-header">
        <h2>{'\u6545\u4E8B'}</h2>
        <span className="story-count">{stories.length} {'\u4E2A\u6545\u4E8B'}</span>
      </div>
      <div className="story-grid">
        {stories.map(function (story, idx) {
          return (
            <StoryCard key={story.type + '-' + idx} story={story}
              onClick={function () { handleStoryClick(story); }} />
          );
        })}
      </div>
    </div>
  );
}

export default StoryView;