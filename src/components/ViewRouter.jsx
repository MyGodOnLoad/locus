import LifemapView from '../views/LifemapView';
import TripListView from '../views/TripListView';
import TripDetailView from '../views/TripDetailView';
import CombinedView from '../views/CombinedView';
import AllPhotosView from '../views/AllPhotosView';

function ViewRouter(props) {
  var viewMode = props.viewMode;
  var photosLength = props.photosLength;

  if (photosLength === 0) return null;

  switch (viewMode) {
    case 'lifemap': return <LifemapView />;
    case 'trip-list': return <TripListView />;
    case 'trip-detail': return <TripDetailView />;
    case 'combined': return <CombinedView />;
    case 'all-photos': return <AllPhotosView />;
    default: return <LifemapView />;
  }
}

export default ViewRouter;
