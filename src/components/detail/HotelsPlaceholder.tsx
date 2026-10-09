'use client';

import { useHotels } from '@/hooks/useHotels';
import { Destination } from '@/types';
import { useItinerary } from '@/context/ItineraryContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton as SkeletonComp } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Plus, Hotel } from 'lucide-react';

interface Props {
  destination: Destination;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-[10px] ${i < Math.floor(rating) ? 'text-yellow-500' : 'text-muted-foreground/30'}`}>★</span>
      ))}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-4">
            <SkeletonComp className="w-12 h-12 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonComp className="h-3 w-32" />
              <SkeletonComp className="h-2.5 w-20" />
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => <SkeletonComp key={s} className="w-2.5 h-2.5 rounded-sm" />)}
              </div>
            </div>
            <div className="text-right space-y-1">
              <SkeletonComp className="h-5 w-16" />
              <SkeletonComp className="h-2.5 w-10" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function HotelsPlaceholder({ destination }: Props) {
  const { hotels, isLoading, error } = useHotels(destination.city, destination.country);
  const { addItem, removeItem, isAdded } = useItinerary();
  const fallbackHotelsUrl = `https://www.google.com/travel/hotels/${encodeURIComponent(destination.city)}`;

  return (
    <div className="mt-2 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hotel className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-foreground text-sm font-semibold tracking-tight">Hotels</h3>
        </div>
        <a href={fallbackHotelsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:text-primary/80 transition-colors">
          View all →
        </a>
      </div>

      {isLoading && <LoadingSkeleton />}

      {error && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-muted-foreground text-xs">Could not load hotels</p>
          <Button variant="outline" size="sm" asChild>
            <a href={fallbackHotelsUrl} target="_blank" rel="noopener noreferrer">Search on Google Hotels →</a>
          </Button>
        </div>
      )}

      {!isLoading && !error && hotels.length > 0 && (
        <div className="space-y-2">
          {hotels.map((hotel, i) => {
            const itemId = `hotel-${hotel.name}`;
            const added = isAdded(itemId);
            const usd = hotel.price ? parseFloat(hotel.price.replace(/[^0-9.]/g, '')) : NaN;
            const priceInr = !isNaN(usd) ? `₹${(usd * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/night` : undefined;

            return (
              <Card key={i} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <a href={hotel.link ?? fallbackHotelsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-muted/60 flex-shrink-0 overflow-hidden border border-border/40">
                        {hotel.thumbnail ? (
                          <img src={hotel.thumbnail} alt={hotel.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Hotel className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-xs font-semibold truncate">{hotel.name}</p>
                        {hotel.rating && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <StarRating rating={hotel.rating} />
                            <span className="text-muted-foreground text-[10px]">{hotel.rating.toFixed(1)}</span>
                            {hotel.reviews && <span className="text-muted-foreground/70 text-[10px]">({hotel.reviews.toLocaleString()})</span>}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {priceInr ? (
                          <>
                            <div className="text-foreground text-sm font-black">{priceInr.split('/')[0]}</div>
                            <div className="text-muted-foreground text-[10px]">per night</div>
                          </>
                        ) : (
                          <div className="text-muted-foreground text-[10px]">Price N/A</div>
                        )}
                      </div>
                    </a>
                    <Button
                      variant={added ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 text-xs flex-shrink-0"
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
                    >
                      {added ? <><Check className="h-3 w-3" /> Added</> : <><Plus className="h-3 w-3" /> Add</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
