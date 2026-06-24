import { create } from "zustand";

export var usePhotoStore = create(function (set, get) {
  return {
    photos: [],
    loading: false,
    error: null,
    viewMode: "combined",
    mapBoundsFilter: null,
    timeFilter: null,
    selectedIndex: -1,
    theme: "ink",

    setPhotos: function (photos) { set({ photos: photos, loading: false, error: null }); },
    setLoading: function (loading) { set({ loading: loading }); },
    setError: function (error) { set({ error: error, loading: false }); },
    addPhotos: function (newPhotos) { set(function (state) { return { photos: state.photos.concat(newPhotos), loading: false }; }); },
    setViewMode: function (mode) {
      set({ viewMode: mode, mapBoundsFilter: null });
    },
    setMapBoundsFilter: function (bounds) { set({ mapBoundsFilter: bounds }); },
    setTimeFilter: function (key) { set({ timeFilter: key }); },
    setSelectedIndex: function (index) { set({ selectedIndex: index }); },
    setTheme: function (theme) { set({ theme: theme }); },
    updatePhoto: function (path, nextPhoto) { set(function (state) { return { photos: state.photos.map(function (p) { return p.path === path ? Object.assign({}, p, nextPhoto) : p; }) }; }); },

    getGeotaggedPhotos: function () {
      return get().photos.filter(function (p) { return p.lat != null; });
    }
  };
});
