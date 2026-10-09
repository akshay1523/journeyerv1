'use client';

import { useState } from 'react';
import { Destination } from '@/types';
import { regionColors } from '@/data/destinations';
import { Activity, useActivities } from '@/hooks/useActivities';
import { Restaurant } from '@/hooks/useRestaurants';
import { useItinerary } from '@/context/ItineraryContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TriangleAlert, MapPin, Utensils, ExternalLink, Check, Plus } from 'lucide-react';

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
      {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className="text-muted-foreground/40 text-[10px]">★</span>)}
    </span>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-3.5">
          <div className="flex gap-3">
            <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/3" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </Card>
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
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        {!hideToggle ? (
          <div className="flex items-center gap-0.5 bg-muted/50 border border-border/40 rounded-lg p-0.5">
            <button
              onClick={() => onTabChange('activities')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                tab === 'activities' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapPin className="h-3 w-3" /> Attractions
            </button>
            <button
              onClick={() => onTabChange('restaurants')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                tab === 'restaurants' ? 'bg-rose-500/10 text-rose-500 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Utensils className="h-3 w-3" /> Restaurants
            </button>
          </div>
        ) : (
          <div className="text-foreground text-sm font-semibold tracking-tight pl-1">
            {tab === 'restaurants' ? 'Restaurants & Cafes' : 'Attractions'}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <Button
              variant={sortKey === 'rating' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setSortKey('rating')}
              title="Sort by rating"
              className="h-6 px-1.5 text-[10px]"
            >
              ★ ↓
            </Button>
            <Button
              variant={sortKey === 'reviews' ? 'secondary' : 'ghost'}
              size="xs"
              onClick={() => setSortKey('reviews')}
              title="Sort by reviews"
              className="h-6 px-1.5 text-[10px]"
            >
              # ↓
            </Button>
          </div>
          <a
            href={tab === 'restaurants' ? mapsSearchUrl : viatorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {tab === 'restaurants' ? 'Maps' : 'Book tours'}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-0.5 bg-background">
        {activeLoading && <SkeletonList />}

        {activeError && (
          <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
            <TriangleAlert className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground text-xs">Could not load results</p>
            <Button variant="outline" size="sm" asChild>
              <a href={tab === 'restaurants' ? mapsSearchUrl : viatorUrl} target="_blank" rel="noopener noreferrer">
                {tab === 'restaurants' ? 'Browse Restaurants →' : 'Browse on Viator →'}
              </a>
            </Button>
          </div>
        )}

        {!activeLoading && !activeError && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
            {tab === 'restaurants' ? <Utensils className="h-8 w-8 text-muted-foreground/40" /> : <MapPin className="h-8 w-8 text-muted-foreground/40" />}
            <p className="text-muted-foreground text-xs">No results found</p>
          </div>
        )}

        {!activeLoading && !activeError && sorted.length > 0 && (
          <div className="space-y-2">
            {sorted.map((place, i) => {
              const itemId = tab === 'restaurants' ? `restaurant-${place.title}` : `activity-${place.title}`;
              const added = isAdded(itemId);
              const mapsUrl = place.data_cid
                ? `https://www.google.com/maps?cid=${place.data_cid}`
                : `https://www.google.com/maps/search/${encodeURIComponent(place.title + ' ' + destination.city)}`;
              const hasCoords = !!place.gps_coordinates;

              return (
                <Card key={place.title + i} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm overflow-visible">
                  <CardContent className="p-3.5">
                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0 w-14 h-14">
                        {place.thumbnail ? (
                          <img src={place.thumbnail} alt={place.title} className="w-full h-full rounded-lg object-cover bg-muted/40" />
                        ) : tab === 'restaurants' ? (
                          <div className="w-full h-full rounded-lg flex items-center justify-center bg-rose-500/10 border border-rose-500/20">
                            <BibGourmandIcon />
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-lg flex items-center justify-center bg-muted/40 border border-border/40" style={{ backgroundColor: accentColor + '10' }} />
                        )}
                        {hasCoords && (
                          <div
                            className="absolute -top-1.5 -left-1.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white border border-border/20"
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
                          <p className="text-foreground text-xs font-semibold leading-snug truncate">{place.title}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant={added ? 'secondary' : 'outline'}
                              size="xs"
                              className="h-6 text-[10px] px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (added) {
                                  removeItem(itemId);
                                } else {
                                  addItem({ id: itemId, type: 'activity', title: place.title, subtitle: destination.city, thumbnail: place.thumbnail });
                                }
                              }}
                            >
                              {added ? <><Check className="h-3 w-3" /> Added</> : <><Plus className="h-3 w-3" /> Add</>}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" title="Open in Google Maps">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        </div>

                        {place.type && <p className="text-muted-foreground/80 text-[10px] mt-0.5 truncate">{place.type}</p>}

                        {place.rating && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <StarRating rating={place.rating} />
                            <span className="text-muted-foreground text-[10px] font-medium">{place.rating.toFixed(1)}</span>
                            {place.reviews && (
                              <span className="text-muted-foreground/75 text-[10px]">
                                ({place.reviews >= 1000 ? `${(place.reviews / 1000).toFixed(0)}k` : place.reviews} reviews)
                              </span>
                            )}
                          </div>
                        )}

                        {place.description && (
                          <p className="text-muted-foreground/85 text-[10px] leading-relaxed mt-1 line-clamp-2">{place.description}</p>
                        )}

                        {tab === 'activities' && (
                          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] text-muted-foreground/70 font-bold uppercase tracking-wider">Book on:</span>
                            {[
                              { name: 'Viator', href: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(place.title + ', ' + destination.city)}` },
                              { name: 'Klook', href: `https://www.klook.com/en-IN/search?query=${encodeURIComponent(place.title + ' ' + destination.city)}` },
                              { name: 'GYG', href: `https://www.getyourguide.com/s?q=${encodeURIComponent(place.title + ' ' + destination.city)}` },
                            ].map(p => (
                              <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer">
                                <Badge variant="outline" className="text-[9px] px-1.5 h-4 cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">{p.name}</Badge>
                              </a>
                            ))}
                          </div>
                        )}

                        {tab === 'restaurants' && (
                          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] text-muted-foreground/70 font-bold uppercase tracking-wider">Reserve:</span>
                            {[
                              { name: 'Maps', href: `https://www.google.com/maps/search/${encodeURIComponent(place.title + ' ' + destination.city)}` },
                              { name: 'TheFork', href: `https://www.thefork.com/search?text=${encodeURIComponent(place.title + ' ' + destination.city)}` },
                              { name: 'TripAdvisor', href: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(place.title + ' ' + destination.city)}` },
                            ].map(p => (
                              <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer">
                                <Badge variant="outline" className="text-[9px] px-1.5 h-4 cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">{p.name}</Badge>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 pt-3 mt-1 border-t border-border/40 flex items-center justify-between">
        {tab === 'restaurants' ? (
          <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Restaurants in {destination.city}
          </a>
        ) : (
          <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(destination.city)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            {destination.city} on Wikipedia
          </a>
        )}
        <a href={`https://www.tripadvisor.com/Search?q=${encodeURIComponent(destination.city)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          TripAdvisor <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
