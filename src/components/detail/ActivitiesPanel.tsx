'use client';

import { useState } from 'react';
import { Destination } from '@/types';
import { regionColors } from '@/data/destinations';
import { Activity, useActivities } from '@/hooks/useActivities';
import { Restaurant } from '@/hooks/useRestaurants';
import { useItinerary } from '@/context/ItineraryContext';

type SortKey = 'rating' | 'reviews';

function BibGourmandIcon() {
  return (
    <svg viewBox="0 0 56 56" width="38" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" fill="#e4002b" />
      <circle cx="28" cy="28" r="21" fill="white" />
      <circle cx="21" cy="22" r="3.2" fill="#e4002b" />
      <circle cx="35" cy="22" r="3.2" fill="#e4002b" />
      <circle cx="22.2" cy="20.8" r="1" fill="white" />
      <circle cx="36.2" cy="20.8" r="1" fill="white" />
      <ellipse cx="28" cy="28.5" rx="2.2" ry="1.5" fill="#e4002b" />
      <path d="M19 33 Q28 40 37 33" stroke="#e4002b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="17" cy="30" r="3" fill="#e4002b" opacity="0.18" />
      <circle cx="39" cy="30" r="3" fill="#e4002b" opacity="0.18" />
    </svg>
  );
}

interface Props {
  destination: Destination;
  activities:  Activity[];
  restaurants: Restaurant[];
  resLoading:  boolean;
  resError:    string | null;
  tab:         'activities' | 'restaurants';
  onTabChange: (t: 'activities' | 'restaurants') => void;
  hideToggle?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: full  }).map((_, i) => <span key={`f${i}`} className="text-yellow-500 text-[10px]">★</span>)}
      {half && <span className="text-yellow-500/60 text-[10px]">★</span>}
      {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className="text-secondary-text/40 text-[10px]">★</span>)}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card-bg border border-border-color rounded-xl p-3.5 animate-pulse">
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-lg bg-secondary-bg flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-secondary-bg rounded w-3/4" />
              <div className="h-2.5 bg-secondary-bg rounded w-1/3" />
              <div className="h-2 bg-secondary-bg rounded w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ActivitiesPanel({ destination, activities, restaurants, resLoading, resError, tab, onTabChange, hideToggle }: Props) {
  const { isLoading, error } = useActivities(destination.city, destination.country);
  const { addItem, removeItem, isAdded } = useItinerary();
  const accentColor = regionColors[destination.region] ?? '#60a5fa';
  const [sortKey, setSortKey] = useState<SortKey>('rating');

  const activeItems = tab === 'restaurants' ? restaurants : activities;
  const activeLoading = tab === 'restaurants' ? resLoading : isLoading;
  const activeError   = tab === 'restaurants' ? resError   : error;

  const sorted = [...activeItems].sort((a, b) =>
    sortKey === 'rating'
      ? (b.rating  ?? 0) - (a.rating  ?? 0)
      : (b.reviews ?? 0) - (a.reviews ?? 0)
  );

  const viatorUrl = `https://www.viator.com/searchResults/all?text=${encodeURIComponent(destination.city + ', ' + destination.country)}`;
  const mapsSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent('restaurants and cafes in ' + destination.city)}`;

  return (
    <div className="flex flex-col h-full bg-primary-bg">

      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        {!hideToggle ? (
          <div className="flex items-center gap-0.5 bg-secondary-bg border border-border-color rounded-lg p-0.5">
            <button
              onClick={() => onTabChange('activities')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                tab === 'activities' ? 'bg-card-bg text-primary-text' : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Attractions
            </button>
            <button
              onClick={() => onTabChange('restaurants')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                tab === 'restaurants' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              <span className="text-[11px]">🍽</span>
              Restaurant/Cafes
            </button>
          </div>
        ) : (
          <div className="text-primary-text text-sm font-semibold pl-1">
            {tab === 'restaurants' ? 'Restaurants & Cafes' : 'Attractions'}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortKey('rating')}
              title="Sort by rating"
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] transition-colors ${sortKey === 'rating' ? 'text-primary-text font-bold bg-secondary-bg border border-border-color' : 'text-secondary-text hover:text-primary-text'}`}
            >
              ★
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSortKey('reviews')}
              title="Sort by reviews"
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] transition-colors ${sortKey === 'reviews' ? 'text-primary-text font-bold bg-secondary-bg border border-border-color' : 'text-secondary-text hover:text-primary-text'}`}
            >
              #
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <a
            href={tab === 'restaurants' ? mapsSearchUrl : viatorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 transition-colors"
          >
            {tab === 'restaurants' ? 'Search Google Maps' : 'Book tours'}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-0.5 bg-primary-bg">
        {activeLoading && <Skeleton />}

        {activeError && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-secondary-text text-xs mb-3">Could not load results</p>
            <a href={tab === 'restaurants' ? mapsSearchUrl : viatorUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">
              {tab === 'restaurants' ? 'Browse Restaurants →' : 'Browse on Viator →'}
            </a>
          </div>
        )}

        {!activeLoading && !activeError && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-secondary-text text-xs">No results found</p>
          </div>
        )}

        {!activeLoading && !activeError && sorted.length > 0 && (
          <div className="space-y-2 bg-primary-bg">
            {sorted.map((place, i) => {
              const itemId = tab === 'restaurants' ? `restaurant-${place.title}` : `activity-${place.title}`;
              const added = isAdded(itemId);
              const mapsUrl = place.data_cid
                ? `https://www.google.com/maps?cid=${place.data_cid}`
                : `https://www.google.com/maps/search/${encodeURIComponent(place.title + ' ' + destination.city)}`;
              const hasCoords = !!place.gps_coordinates;

              return (
                <div key={place.title + i} className="bg-card-bg hover:bg-secondary-bg/30 border border-border-color rounded-xl p-3.5 transition-all">
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0 w-14 h-14">
                      {place.thumbnail ? (
                        <img src={place.thumbnail} alt={place.title} className="w-full h-full rounded-lg object-cover bg-secondary-bg" />
                      ) : tab === 'restaurants' ? (
                        <div className="w-full h-full rounded-lg flex items-center justify-center bg-[#e4002b]/10 border border-[#e4002b]/20">
                          <BibGourmandIcon />
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColor + '15', border: `1px solid ${accentColor}25` }} />
                      )}
                      {hasCoords && (
                        <div
                          className="absolute -top-1.5 -left-1.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white border border-border-color"
                          style={{
                            backgroundColor: tab === 'restaurants' ? '#f43f5e' : accentColor,
                            borderRadius: tab === 'restaurants' ? '3px' : '50%',
                            transform: tab === 'restaurants' ? 'rotate(45deg)' : undefined,
                          }}
                        >
                          <span style={{ transform: tab === 'restaurants' ? 'rotate(-45deg)' : undefined }}>{i + 1}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-primary-text text-xs font-semibold leading-snug truncate">{place.title}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (added) {
                                removeItem(itemId);
                              } else {
                                addItem({
                                  id: itemId,
                                  type: 'activity',
                                  title: place.title,
                                  subtitle: destination.city,
                                  thumbnail: place.thumbnail,
                                });
                              }
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                              added
                                ? 'bg-green-500/10 border-green-500/20 text-green-500 font-bold'
                                : 'bg-card-bg border-border-color text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
                            }`}
                          >
                            {added ? '✓ Added' : '+ Add'}
                          </button>
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-secondary-text hover:text-primary-text transition-colors mt-0.5" title="Open in Google Maps">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>

                      {place.type && <p className="text-secondary-text/80 text-[10px] mt-0.5 truncate">{place.type}</p>}

                      {place.rating && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <StarRating rating={place.rating} />
                          <span className="text-secondary-text text-[10px] font-medium">{place.rating.toFixed(1)}</span>
                          {place.reviews && (
                            <span className="text-secondary-text/75 text-[10px]">
                              ({place.reviews >= 1000 ? `${(place.reviews / 1000).toFixed(0)}k` : place.reviews} reviews)
                            </span>
                          )}
                        </div>
                      )}

                      {place.description && (
                        <p className="text-secondary-text/85 text-[10px] leading-relaxed mt-1 line-clamp-2">{place.description}</p>
                      )}

                      {/* Recommended Booking/Reservation Platforms Tags */}
                      {tab === 'activities' && (
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] text-secondary-text/70 font-bold uppercase tracking-wider">Book on:</span>
                          <a
                            href={`https://www.viator.com/searchResults/all?text=${encodeURIComponent(place.title + ', ' + destination.city)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded bg-secondary-bg hover:bg-accent-color border border-border-color text-secondary-text hover:text-white transition-colors text-[9px] font-bold"
                          >
                            Viator
                          </a>
                          <a
                            href={`https://www.klook.com/en-IN/search?query=${encodeURIComponent(place.title + ' ' + destination.city)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded bg-secondary-bg hover:bg-accent-color border border-border-color text-secondary-text hover:text-white transition-colors text-[9px] font-bold"
                          >
                            Klook
                          </a>
                          <a
                            href={`https://www.getyourguide.com/s?q=${encodeURIComponent(place.title + ' ' + destination.city)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded bg-secondary-bg hover:bg-accent-color border border-border-color text-secondary-text hover:text-white transition-colors text-[9px] font-bold"
                          >
                            GYG
                          </a>
                        </div>
                      )}

                      {tab === 'restaurants' && (
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] text-secondary-text/70 font-bold uppercase tracking-wider">Reserve:</span>
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(place.title + ' ' + destination.city)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded bg-secondary-bg hover:bg-accent-color border border-border-color text-secondary-text hover:text-white transition-colors text-[9px] font-bold"
                          >
                            Maps
                          </a>
                          <a
                            href={`https://www.thefork.com/search?text=${encodeURIComponent(place.title + ' ' + destination.city)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded bg-secondary-bg hover:bg-accent-color border border-border-color text-secondary-text hover:text-white transition-colors text-[9px] font-bold"
                          >
                            TheFork
                          </a>
                          <a
                            href={`https://www.tripadvisor.com/Search?q=${encodeURIComponent(place.title + ' ' + destination.city)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-0.5 rounded bg-secondary-bg hover:bg-accent-color border border-border-color text-secondary-text hover:text-white transition-colors text-[9px] font-bold"
                          >
                            TripAdvisor
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 pt-3 mt-1 border-t border-border-color flex items-center justify-between">
        {tab === 'restaurants' ? (
          <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-text hover:text-primary-text transition-colors flex items-center gap-1">
            Restaurants & Cafes in {destination.city}
          </a>
        ) : (
          <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(destination.city)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-text hover:text-primary-text transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {destination.city} on Wikipedia
          </a>
        )}
        <a href={`https://www.tripadvisor.com/Search?q=${encodeURIComponent(destination.city)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-text hover:text-primary-text transition-colors flex items-center gap-1">
          TripAdvisor
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}