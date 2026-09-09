'use client';

import { useItinerary, ItineraryItem } from '@/context/ItineraryContext';

export default function RecommendationsTabContent() {
  const { videos, addItem, removeItem, isAdded, removeVideo } = useItinerary();

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border-color rounded-2xl bg-card-bg p-6">
        <div className="w-12 h-12 bg-accent-color/10 border border-accent-color/20 text-accent-color flex items-center justify-center rounded-full mb-4 text-xl">
          🎬
        </div>
        <h3 className="text-primary-text text-sm font-bold">No travel video recommendations yet</h3>
        <p className="text-secondary-text text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
          Click the <strong className="text-primary-text">➕ Add Content</strong> button in the top header and paste a YouTube travel video URL to extract destinations, attractions, hotels, and dining recommendations!
        </p>
      </div>
    );
  }

  const handleAddPlace = (place: { name: string; type: 'attraction' | 'restaurant' | 'hotel'; description: string }, videoTitle: string) => {
    let itemId = '';
    let itemType: ItineraryItem['type'] = 'activity';

    if (place.type === 'hotel') {
      itemId = `hotel-${place.name}`;
      itemType = 'hotel';
    } else if (place.type === 'restaurant') {
      itemId = `restaurant-${place.name}`;
      itemType = 'activity';
    } else {
      itemId = `activity-${place.name}`;
      itemType = 'activity';
    }

    const alreadyAdded = isAdded(itemId);
    if (alreadyAdded) {
      removeItem(itemId);
    } else {
      addItem({
        id: itemId,
        type: itemType,
        title: place.name,
        subtitle: `From video: ${videoTitle}`,
        description: place.description,
      });
    }
  };

  const getPlaceItemId = (placeName: string, type: string) => {
    if (type === 'hotel') return `hotel-${placeName}`;
    if (type === 'restaurant') return `restaurant-${placeName}`;
    return `activity-${placeName}`;
  };

  return (
    <div className="space-y-8 pb-10">
      {videos.map((video) => (
        <div key={video.videoId} className="space-y-4 bg-secondary-bg/20 border border-border-color/60 p-5 rounded-2xl relative">
          
          {/* Remove Video reference */}
          <button
            onClick={() => removeVideo(video.videoId)}
            className="absolute top-4 right-4 text-secondary-text hover:text-rose-500 text-xs transition-colors flex items-center gap-1 bg-card-bg border border-border-color px-2 py-1 rounded-lg font-bold"
          >
            <span>🗑</span> Remove Video
          </button>

          {/* Video Reference Banner */}
          <div className="flex gap-4 items-start border-b border-border-color/30 pb-4 pr-24">
            <div className="relative flex-shrink-0 w-28 aspect-video rounded-xl overflow-hidden bg-black border border-border-color shadow-lg">
              <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className="w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center text-xs font-black shadow-md border border-white/20">
                  ▶
                </span>
              </div>
            </div>
            <div className="space-y-1 pt-1">
              <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-500 font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider">
                YouTube Source
              </span>
              <h4 className="text-primary-text text-xs font-bold leading-snug line-clamp-2" title={video.title}>
                {video.title}
              </h4>
              <a
                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-500 hover:text-blue-400 transition-colors inline-block"
              >
                Watch original video →
              </a>
            </div>
          </div>

          {/* Place Recommendations Grid (Moodboard style) */}
          <div>
            <h5 className="text-[10px] text-secondary-text font-bold uppercase tracking-wider mb-3">
              Extracted Places ({video.places.length})
            </h5>
            
            {video.places.length === 0 ? (
              <p className="text-secondary-text text-xs italic py-2">
                No specific attractions, restaurants, or hotels could be identified in this video transcript.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {video.places.map((place, idx) => {
                  const itemId = getPlaceItemId(place.name, place.type);
                  const added = isAdded(itemId);
                  
                  return (
                    <div
                      key={place.name + idx}
                      className="bg-card-bg border border-border-color hover:border-accent-color/20 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h6 className="text-primary-text text-xs font-bold leading-snug tracking-tight">
                            {place.name}
                          </h6>
                          <span
                            className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              place.type === 'hotel'
                                ? 'bg-orange-500/10 border border-orange-500/20 text-orange-500'
                                : place.type === 'restaurant'
                                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                                : 'bg-accent-color/10 border border-accent-color/20 text-accent-color'
                            }`}
                          >
                            {place.type}
                          </span>
                        </div>
                        {place.description && (
                          <p className="text-secondary-text text-[10.5px] leading-relaxed italic line-clamp-3">
                            "{place.description}"
                          </p>
                        )}
                        {place.country && (
                          <div className="text-[9px] text-secondary-text/80 font-medium">
                            📍 {place.country}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddPlace(place, video.title)}
                        className={`w-full py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                          added
                            ? 'bg-green-500/10 border-green-500/20 text-green-500'
                            : 'bg-card-bg border-border-color text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
                        }`}
                      >
                        {added ? '✓ Added' : '+ Add to Itinerary'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ))}
    </div>
  );
}
