'use client';

import { useState } from 'react';
import { Destination, DateRange } from '@/types';
import { useItinerary } from '@/context/ItineraryContext';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ListTodo, Trash2, X, Sparkles, RefreshCw } from 'lucide-react';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.city,
          departureDate: format(dates.departure, 'yyyy-MM-dd'),
          returnDate: format(dates.returnDate, 'yyyy-MM-dd'),
          duration: durationDays,
          travelers,
          items: items.map((i) => ({ id: i.id, type: i.type, title: i.title, subtitle: i.subtitle, price: i.price })),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to generate itinerary');
      setItinerary(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'activity': return '📍';
      case 'restaurant': return '🍽';
      default: return '💡';
    }
  };

  const groupSections = [
    { label: 'Flights', items: flights, emoji: '✈️' },
    { label: 'Hotels', items: hotels, emoji: '🏨' },
    { label: 'Attractions', items: attractions, emoji: '📍' },
    { label: 'Restaurants & Cafes', items: restaurants, emoji: '🍽' },
  ].filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Selected Trip Elements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground text-sm font-semibold tracking-tight">Selected Trip Elements</h3>
          {items.length > 0 && (
            <Button variant="destructive" size="xs" onClick={clearAll} className="h-6 text-[10px]">
              <Trash2 className="h-3 w-3" /> Clear All
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center border border-dashed border-border/40 rounded-xl">
            <ListTodo className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-xs">Your itinerary is empty</p>
            <p className="text-muted-foreground/60 text-[10px]">Add items from Flights, Hotels, Attractions, or Restaurants</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupSections.map((group) => (
              <Card key={group.label} className="overflow-hidden">
                <CardHeader className="py-2.5 px-4 bg-muted/30">
                  <CardTitle className="text-xs text-muted-foreground font-medium">
                    {group.emoji} {group.label} ({group.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/40">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 text-xs hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        ) : (
                          <span className="text-sm flex-shrink-0">{getIcon(item.type)}</span>
                        )}
                        <div className="min-w-0">
                          <p className="text-foreground font-semibold truncate">{item.title}</p>
                          <p className="text-muted-foreground text-[10px]">{item.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {item.price && <span className="text-primary font-bold">{item.price}</span>}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* AI Generator Panel */}
      <div className="border-t border-border/40 pt-5">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-foreground text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Itinerary Generator
              </h4>
              <p className="text-muted-foreground text-[10px] mt-0.5">Generate a smart day-wise plan for {durationDays} days.</p>
            </div>
            <div className="flex items-center gap-2 bg-background/60 border border-border/40 rounded-xl px-2.5 py-1">
              <span className="text-[10px] text-muted-foreground">Travellers:</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setTravelers(Math.max(1, travelers - 1))}>
                  <span className="text-xs font-bold">-</span>
                </Button>
                <span className="text-xs text-foreground font-bold w-4 text-center">{travelers}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setTravelers(Math.min(10, travelers + 1))}>
                  <span className="text-xs font-bold">+</span>
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-[11px] rounded-xl p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Generation Failed</p>
                <p className="text-destructive/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
              <p className="text-foreground text-xs font-semibold">Gemini is building your travel plan...</p>
              <p className="text-muted-foreground text-[10px] mt-1 max-w-[200px]">Organizing flights, hotels, and matching attraction schedules.</p>
            </div>
          ) : itinerary ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Itinerary generated
                </span>
                <Button variant="ghost" size="sm" onClick={handleGenerate} className="h-6 text-xs text-primary">
                  <RefreshCw className="h-3 w-3" /> Regenerate
                </Button>
              </div>
              <div className="space-y-5">
                {itinerary.map((day) => (
                  <div key={day.day} className="relative pl-4 border-l border-border/30 last:border-0 pb-1">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border border-background" />
                    <div className="mb-2.5">
                      <span className="text-primary text-xs font-extrabold uppercase tracking-wider">Day {day.day}</span>
                      <span className="text-muted-foreground text-[10px] mx-1.5">|</span>
                      <span className="text-muted-foreground text-[10px] font-medium">
                        {day.date ? format(new Date(day.date), 'EEE, MMM d') : ''}
                      </span>
                      <h4 className="text-foreground text-xs font-bold mt-0.5">{day.theme}</h4>
                    </div>
                    <div className="space-y-2">
                      {day.activities.map((act, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl p-3 border text-xs ${
                            act.type === 'recommendation'
                              ? 'bg-amber-500/5 border-amber-500/20'
                              : 'bg-card border-border/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{getIcon(act.type)}</span>
                              <Badge variant="secondary" className="text-[9px] px-1.5 uppercase tracking-wider">{act.time}</Badge>
                            </div>
                            {act.type === 'recommendation' && (
                              <Badge variant="warning" className="text-[9px]">Recommended</Badge>
                            )}
                          </div>
                          <p className="text-foreground font-semibold mt-1.5">{act.title}</p>
                          <p className="text-muted-foreground text-[10px] leading-relaxed mt-1">{act.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={items.length === 0}
              className="w-full"
            >
              <Sparkles className="h-4 w-4" /> Generate AI Itinerary
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
