'use client';

import { useState } from 'react';
import { Destination, DateRange } from '@/types';
import { useItinerary, ItineraryItem } from '@/context/ItineraryContext';
import { format, differenceInDays } from 'date-fns';

interface Props {
  destination: Destination;
  dates: DateRange;
}

interface Activity {
  time: string;
  title: string;
  description: string;
  type: 'flight' | 'hotel' | 'activity' | 'restaurant' | 'recommendation';
  itemId?: string;
}

interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
}

export default function ItineraryTabContent({ destination, dates }: Props) {
  const { items, removeItem, clearAll } = useItinerary();
  const [travelers, setTravelers] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const durationDays = differenceInDays(dates.returnDate, dates.departure) + 1;

  // Group items by type
  const flights = items.filter((i) => i.type === 'flight');
  const hotels = items.filter((i) => i.type === 'hotel');
  const attractions = items.filter((i) => i.type === 'activity' && i.id.startsWith('activity-'));
  const restaurants = items.filter((i) => i.type === 'activity' && i.id.startsWith('restaurant-') || i.id.startsWith('activity-') === false && i.type === 'activity' && !i.id.startsWith('flight-') && !i.id.startsWith('hotel-'));

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: destination.city,
          departureDate: format(dates.departure, 'yyyy-MM-dd'),
          returnDate: format(dates.returnDate, 'yyyy-MM-dd'),
          duration: durationDays,
          travelers,
          items: items.map((i) => ({
            id: i.id,
            type: i.type,
            title: i.title,
            subtitle: i.subtitle,
            price: i.price,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to generate itinerary');
      }

      setItinerary(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return '✈️';
      case 'hotel':
        return '🏨';
      case 'activity':
        return '📍';
      case 'restaurant':
        return '🍽';
      default:
        return '💡';
    }
  };

  return (
    <div className="space-y-6">
      {/* Grouped Added Items List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary-text text-sm font-semibold">Selected Trip Elements</h3>
          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-rose-500 hover:text-rose-600 transition-colors border border-rose-500/20 px-2.5 py-1 rounded-lg bg-rose-500/10 font-bold"
            >
              Clear All
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 bg-card-bg border border-border-color rounded-xl px-4">
            <p className="text-secondary-text text-xs">Your itinerary list is empty.</p>
            <p className="text-secondary-text/80 text-[10px] mt-1">
              Go to Flights, Hotels, Attractions, or Restaurants and click "+ Add" to build your trip.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Flights */}
            {flights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-secondary-text text-xs font-medium pl-1">Flights ({flights.length})</h4>
                <div className="grid gap-2">
                  {flights.map((item) => (
                    <div key={item.id} className="bg-card-bg border border-border-color rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">✈️</span>
                        <div>
                          <p className="text-primary-text font-semibold">{item.title}</p>
                          <p className="text-secondary-text text-[10px]">{item.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-accent-color font-bold">{item.price}</span>
                        <button onClick={() => removeItem(item.id)} className="text-secondary-text hover:text-rose-500 transition-colors font-bold">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotels */}
            {hotels.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-secondary-text text-xs font-medium pl-1">Hotels ({hotels.length})</h4>
                <div className="grid gap-2">
                  {hotels.map((item) => (
                    <div key={item.id} className="bg-card-bg border border-border-color rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        ) : (
                          <span className="text-sm flex-shrink-0">🏨</span>
                        )}
                        <div className="min-w-0">
                          <p className="text-primary-text font-semibold truncate">{item.title}</p>
                          <p className="text-secondary-text text-[10px]">{item.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-accent-color font-bold">{item.price}</span>
                        <button onClick={() => removeItem(item.id)} className="text-secondary-text hover:text-rose-500 transition-colors font-bold">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attractions */}
            {attractions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-secondary-text text-xs font-medium pl-1">Attractions ({attractions.length})</h4>
                <div className="grid gap-2">
                  {attractions.map((item) => (
                    <div key={item.id} className="bg-card-bg border border-border-color rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        ) : (
                          <span className="text-sm flex-shrink-0">📍</span>
                        )}
                        <div className="min-w-0">
                          <p className="text-primary-text font-semibold truncate">{item.title}</p>
                          <p className="text-secondary-text text-[10px]">{item.subtitle}</p>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-secondary-text hover:text-rose-500 transition-colors flex-shrink-0 font-bold">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {restaurants.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-secondary-text text-xs font-medium pl-1">Restaurants & Cafes ({restaurants.length})</h4>
                <div className="grid gap-2">
                  {restaurants.map((item) => (
                    <div key={item.id} className="bg-card-bg border border-border-color rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        ) : (
                          <span className="text-sm flex-shrink-0">🍽</span>
                        )}
                        <div className="min-w-0">
                          <p className="text-primary-text font-semibold truncate">{item.title}</p>
                          <p className="text-secondary-text text-[10px]">{item.subtitle}</p>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-secondary-text hover:text-rose-500 transition-colors flex-shrink-0 font-bold">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Generator Panel */}
      <div className="border-t border-border-color pt-5">
        <div className="bg-accent-color/5 border border-accent-color/20 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-primary-text text-xs font-bold flex items-center gap-1.5">
                <span>✨</span> AI Itinerary Generator
              </h4>
              <p className="text-secondary-text text-[10px] mt-0.5">
                Generate a smart day-wise plan for {durationDays} days.
              </p>
            </div>
            
            {/* Travelers Selector */}
            <div className="flex items-center gap-2 bg-card-bg border border-border-color rounded-xl px-2.5 py-1">
              <span className="text-[10px] text-secondary-text">Travellers:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTravelers(Math.max(1, travelers - 1))}
                  className="text-xs text-secondary-text hover:text-primary-text px-1 font-bold"
                >
                  -
                </button>
                <span className="text-xs text-primary-text font-bold w-4 text-center">{travelers}</span>
                <button
                  onClick={() => setTravelers(Math.min(10, travelers + 1))}
                  className="text-xs text-secondary-text hover:text-primary-text px-1 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] rounded-xl p-3">
              <p className="font-semibold">Generation Failed</p>
              <p className="text-rose-500/80 mt-0.5">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-6 h-6 border-2 border-accent-color/30 border-t-accent-color rounded-full animate-spin mb-3" />
              <p className="text-primary-text text-xs font-semibold">Gemini is building your travel plan...</p>
              <p className="text-secondary-text text-[10px] mt-1 max-w-[200px]">
                Organizing flights, hotels, and matching attraction schedules.
              </p>
            </div>
          ) : itinerary ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-color/40 pb-2">
                <span className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Itinerary generated successfully
                </span>
                <button
                  onClick={handleGenerate}
                  className="text-xs text-accent-color hover:text-accent-color/80 font-semibold transition-colors flex items-center gap-1"
                >
                  <span>🔄</span> Regenerate
                </button>
              </div>

              {/* Day-by-Day Timeline Render */}
              <div className="space-y-5">
                {itinerary.map((day) => (
                  <div key={day.day} className="relative pl-4 border-l border-border-color/30 last:border-0 pb-1">
                    {/* Day Marker */}
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent-color border border-primary-bg" />
                    
                    <div className="mb-2.5">
                      <span className="text-accent-color text-xs font-extrabold uppercase tracking-wider">
                        Day {day.day}
                      </span>
                      <span className="text-secondary-text text-[10px] mx-1.5">|</span>
                      <span className="text-secondary-text text-[10px] font-medium">
                        {day.date ? format(new Date(day.date), 'EEE, MMM d') : ''}
                      </span>
                      <h4 className="text-primary-text text-xs font-bold mt-0.5">{day.theme}</h4>
                    </div>

                    <div className="space-y-2">
                      {day.activities.map((act, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl p-3 border text-xs ${
                            act.type === 'recommendation'
                              ? 'bg-yellow-500/5 border-yellow-500/20'
                              : 'bg-card-bg border-border-color'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm" title={act.type}>{getIcon(act.type)}</span>
                              <span className="text-[10px] font-semibold text-secondary-text bg-secondary-bg border border-border-color/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {act.time}
                              </span>
                            </div>
                            {act.type === 'recommendation' && (
                              <span className="text-[9px] bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-1.5 py-0.2 rounded-full font-bold uppercase">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-primary-text font-semibold mt-1.5">{act.title}</p>
                          <p className="text-secondary-text text-[10px] leading-relaxed mt-1">{act.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={items.length === 0}
              className="w-full py-2.5 bg-accent-color hover:bg-accent-color/90 disabled:opacity-30 disabled:hover:bg-accent-color disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span>✨</span> Generate AI Itinerary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
