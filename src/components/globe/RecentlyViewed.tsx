'use client';

import { format } from 'date-fns';
import { RecentSearch } from '@/types';
import { regionColors } from '@/data/destinations';

interface Props {
  searches:  RecentSearch[];
  onSelect:  (s: RecentSearch) => void;
}

export default function RecentlyViewed({ searches, onSelect }: Props) {
  if (searches.length === 0) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pointer-events-auto">
      <span className="text-secondary-text text-xs uppercase tracking-widest whitespace-nowrap select-none">
        Recent
      </span>
      <div className="flex gap-2">
        {searches.map((s) => (
          <button
            key={s.destination.id}
            onClick={() => onSelect(s)}
            className="flex items-center gap-2 bg-card-bg hover:bg-secondary-bg/85 backdrop-blur border border-border-color hover:border-accent-color/40 rounded-xl px-3 py-2 transition-all group"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform"
              style={{ backgroundColor: regionColors[s.destination.region] ?? '#60a5fa' }}
            />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-primary-text text-xs font-semibold">{s.destination.city}</span>
                <span className="text-secondary-text text-xs">{s.destination.countryCode}</span>
              </div>
              <div className="text-secondary-text/80 text-[10px] mt-0.5">
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
