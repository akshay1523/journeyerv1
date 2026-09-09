'use client';

import { useHotels } from '@/hooks/useHotels';
import { Destination } from '@/types';
import { useItinerary } from '@/context/ItineraryContext';

interface Props {
  destination: Destination;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-[10px] ${i < Math.floor(rating) ? 'text-yellow-500' : 'text-secondary-text/30'}`}>★</span>
      ))}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="border border-border-color rounded-xl overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border-color/30 last:border-0 animate-pulse">
          <div className="w-12 h-12 rounded-lg bg-secondary-bg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-secondary-bg rounded" />
            <div className="h-2.5 w-20 bg-secondary-bg rounded" />
            <div className="flex gap-1">
              {[1,2,3,4,5].map(s => <div key={s} className="w-2.5 h-2.5 bg-secondary-bg rounded-sm" />)}
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="h-5 w-16 bg-secondary-bg rounded" />
            <div className="h-2.5 w-10 bg-secondary-bg rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HotelsPlaceholder({ destination }: Props) {
  const { hotels, isLoading, error } = useHotels(destination.city, destination.country);
  const { addItem, removeItem, isAdded } = useItinerary();
  const fallbackHotelsUrl = `https://www.google.com/travel/hotels/${encodeURIComponent(destination.city)}`;

  return (
    <div className="mt-6 bg-primary-bg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-primary-text text-sm font-semibold">Hotels</h3>
        <a
          href={fallbackHotelsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
        >
          View all →
        </a>
      </div>

      {isLoading && <Skeleton />}

      {error && (
        <div className="text-center py-6">
          <p className="text-secondary-text text-xs mb-2">Could not load hotels</p>
          <a href={fallbackHotelsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-400">
            Search on Google Hotels →
          </a>
        </div>
      )}

      {!isLoading && !error && hotels.length > 0 && (
        <div className="border border-border-color rounded-xl overflow-hidden bg-primary-bg">
          {hotels.map((hotel, i) => {
            const itemId = `hotel-${hotel.name}`;
            const added = isAdded(itemId);
            const usd = hotel.price ? parseFloat(hotel.price.replace(/[^0-9.]/g, '')) : NaN;
            const priceInr = !isNaN(usd) ? `₹${(usd * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/night` : undefined;

            return (
              <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border-color/30 last:border-0 hover:bg-secondary-bg/25 transition-colors">
                <a href={hotel.link ?? fallbackHotelsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-secondary-bg flex-shrink-0 overflow-hidden">
                    {hotel.thumbnail ? (
                      <img src={hotel.thumbnail} alt={hotel.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-primary-text text-xs font-semibold truncate">{hotel.name}</p>
                    {hotel.rating && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <StarRating rating={hotel.rating} />
                        <span className="text-secondary-text text-[10px]">{hotel.rating.toFixed(1)}</span>
                        {hotel.reviews && <span className="text-secondary-text/80 text-[10px]">({hotel.reviews.toLocaleString()})</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {priceInr ? (
                      <>
                        <div className="text-primary-text text-sm font-black">{priceInr.split('/')[0]}</div>
                        <div className="text-secondary-text text-[10px]">per night</div>
                      </>
                    ) : (
                      <div className="text-secondary-text text-[10px]">Price unavailable</div>
                    )}
                  </div>
                </a>
                <button
                  onClick={() => {
                    if (added) {
                      removeItem(itemId);
                    } else {
                      addItem({
                        id: itemId,
                        type: 'hotel',
                        title: hotel.name,
                        subtitle: destination.city,
                        price: priceInr,
                        thumbnail: hotel.thumbnail,
                      });
                    }
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex-shrink-0 ${
                    added
                      ? 'bg-green-500/10 border-green-500/20 text-green-500 font-bold'
                      : 'bg-card-bg border-border-color text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
                  }`}
                >
                  {added ? '✓ Added' : '+ Add'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}