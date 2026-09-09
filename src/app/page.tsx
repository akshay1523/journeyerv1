'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AppPhase, Destination, DateRange, LatLng, RecentSearch } from '@/types';
import { getAllDestinations } from '@/data/destinations';
import DateRangePicker from '@/components/calendar/DateRangePicker';
import DetailView from '@/components/detail/DetailView';
import { parse, addDays } from 'date-fns';

const GlobeView = dynamic(() => import('@/components/globe/GlobeView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  ),
});

const DEFAULT_ORIGIN = {
  iata: 'DEL',
  coords: { lat: 28.5665, lng: 77.1031 } as LatLng,
};

const RECENTLY_VIEWED_KEY = 'tt_recently_viewed';

function getMonthDate(monthName: string): Date {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = months.indexOf(monthName);
  const now = new Date();
  let year = now.getFullYear();
  if (monthIndex < now.getMonth()) {
    year += 1;
  }
  return new Date(year, monthIndex, 4); // Start 4 days in to avoid timezone/past-date edge cases
}

function loadRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (JSON.parse(raw) as any[]).map(r => ({
      ...r,
      dates: {
        departure:  new Date(r.dates.departure),
        returnDate: new Date(r.dates.returnDate),
      },
    }));
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: RecentSearch[]) {
  try {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(searches));
  } catch { /* ignore */ }
}

export default function Page() {
  const [phase, setPhase]             = useState<AppPhase>('globe');
  const [originIata, setOriginIata]   = useState<string>(DEFAULT_ORIGIN.iata);
  const [originCoords, setOriginCoords] = useState<LatLng>(DEFAULT_ORIGIN.coords);
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [dateRange, setDateRange]     = useState<DateRange | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recently viewed + restore shared URL params on mount
  useEffect(() => {
    setRecentSearches(loadRecentSearches());

    const params = new URLSearchParams(window.location.search);
    const destId = params.get('dest');
    const dep    = params.get('dep');
    const ret    = params.get('ret');
    const from   = params.get('from');

    if (destId && dep && ret) {
      const dest = getAllDestinations().find(d => d.id === destId);
      if (dest) {
        try {
          const departure  = parse(dep, 'yyyy-MM-dd', new Date());
          const returnDate = parse(ret, 'yyyy-MM-dd', new Date());
          setSelectedDest(dest);
          setDateRange({ departure, returnDate });
          if (from) setOriginIata(from);
          setPhase('detail');
        } catch { /* invalid dates, ignore */ }
      }
    }
  }, []);

  const handleOriginSet = (iata: string, coords: LatLng) => {
    setOriginIata(iata);
    setOriginCoords(coords);
  };

  const handleOnboardingSelect = (dest: Destination, onboardingData: { days: number; month: string }) => {
    setSelectedDest(dest);

    // Calculate dates based on onboarding inputs
    const departure = getMonthDate(onboardingData.month);
    const returnDate = addDays(departure, onboardingData.days);

    setDateRange({ departure, returnDate });
    setPhase('calendar'); // Transition to calendar to confirm dates over the globe
  };

  const handleDatesConfirmed = (range: DateRange) => {
    setDateRange(range);
    setPhase('detail');

    if (selectedDest) {
      setRecentSearches(prev => {
        const entry: RecentSearch = { destination: selectedDest, dates: range, originIata };
        const filtered = prev.filter(r => r.destination.id !== selectedDest.id);
        const updated  = [entry, ...filtered].slice(0, 3);
        saveRecentSearches(updated);
        return updated;
      });
    }
  };

  const handleRecentSelect = (search: RecentSearch) => {
    setSelectedDest(search.destination);
    setDateRange(search.dates);
    setOriginIata(search.originIata);
    setPhase('detail');
  };

  const handleReset = () => {
    setPhase('globe');
    setSelectedDest(null);
    setDateRange(null);
  };

  return (
    <main className="w-full h-screen overflow-hidden bg-[#0a0a0f]">
      {(phase === 'globe' || phase === 'calendar') && (
        <div className="block">
          <GlobeView
            onDestinationSelect={handleOnboardingSelect}
            onOriginSet={handleOriginSet}
            originIata={originIata}
            originCoords={originCoords}
            recentSearches={recentSearches}
            onRecentSelect={handleRecentSelect}
          />
          {phase === 'calendar' && selectedDest && (
            <DateRangePicker
              destination={selectedDest}
              onConfirm={handleDatesConfirmed}
              onBack={() => setPhase('globe')}
            />
          )}
        </div>
      )}

      {phase === 'detail' && selectedDest && dateRange && (
        <DetailView
          originIata={originIata}
          destination={selectedDest}
          dates={dateRange}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
