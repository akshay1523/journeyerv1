'use client';

import { format } from 'date-fns';
import { RecentSearch } from '@/types';
import { regionColors } from '@/data/destinations';
import { Clock } from 'lucide-react';

interface Props {
  searches:  RecentSearch[];
  onSelect:  (s: RecentSearch) => void;
}

export default function RecentlyViewed({ searches, onSelect }: Props) {
  if (searches.length === 0) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pointer-events-auto">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span className="text-xs uppercase tracking-widest whitespace-nowrap select-none font-medium">Recent</span>
      </div>
      <div className="flex gap-2">
        {searches.map((s) => (
          <button
            key={s.destination.id}
            onClick={() => onSelect(s)}
            className="flex items-center gap-2 backdrop-blur-md bg-background/80 border border-border/60 hover:border-primary/40 rounded-xl px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform"
              style={{ backgroundColor: regionColors[s.destination.region] ?? '#60a5fa' }}
            />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-foreground text-xs font-semibold">{s.destination.city}</span>
                <span className="text-muted-foreground text-xs">{s.destination.countryCode}</span>
              </div>
              <div className="text-muted-foreground/80 text-[10px] mt-0.5">
                {format(s.dates.departure, 'MMM d')} – {format(s.dates.returnDate, 'MMM d')}
                <span className="mx-1">·</span>
                {s.originIata}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
