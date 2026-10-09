'use client';

import { useState } from 'react';
import { Destination, LatLng, RecentSearch } from '@/types';
import { getAllDestinations, regionColors, PRICE_LEGEND } from '@/data/destinations';
import GlobeScene from './GlobeScene';
import RecentlyViewed from './RecentlyViewed';
import OnboardingSidebar from './OnboardingSidebar';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

const REGION_LEGEND = [
  { label: 'Europe',      color: regionColors.Europe },
  { label: 'Asia',        color: regionColors.Asia },
  { label: 'Americas',    color: regionColors.Americas },
  { label: 'Oceania',     color: regionColors.Oceania },
  { label: 'Middle East', color: regionColors.MiddleEast },
  { label: 'Africa',      color: regionColors.Africa },
];

interface Props {
  onDestinationSelect: (d: Destination, onboardingData: { days: number; month: string }) => void;
  onOriginSet: (iata: string, coords: LatLng) => void;
  originIata: string;
  originCoords: LatLng;
  recentSearches: RecentSearch[];
  onRecentSelect: (s: RecentSearch) => void;
}

export default function GlobeView({
  onDestinationSelect, onOriginSet, originIata, recentSearches, onRecentSelect,
}: Props) {
  const destinations = getAllDestinations();
  const [colorMode, setColorMode] = useState<'region' | 'price'>('region');
  const { theme, toggleTheme } = useTheme();

  const legend = colorMode === 'region' ? REGION_LEGEND : PRICE_LEGEND;

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">

      {/* Top Right: Stats + Theme Toggle */}
      <div className="absolute top-0 right-0 z-10 px-8 pt-7 pb-4 flex items-center gap-4 select-none">
        <div className="text-right pointer-events-none">
          <p className="text-foreground text-sm font-semibold tracking-tight">{destinations.length} Destinations</p>
          <p className="text-muted-foreground text-xs">Explore and select a country to begin</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="backdrop-blur-md bg-background/70"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Onboarding Sidebar */}
      <OnboardingSidebar
        onSelectDestination={onDestinationSelect}
        onOriginSet={onOriginSet}
        originIata={originIata}
      />

      {/* Globe */}
      <GlobeScene
        destinations={destinations}
        onDestinationSelect={(d) => {
          onDestinationSelect(d, { days: 7, month: 'Dec' });
        }}
        colorMode={colorMode}
      />

      {/* Recently Viewed */}
      <RecentlyViewed searches={recentSearches} onSelect={onRecentSelect} />

      {/* Legend */}
      <div className="absolute bottom-8 right-8 z-20 backdrop-blur-sm bg-background/80 border border-border/60 rounded-xl p-4 shadow-sm">
        {/* Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-border/40 mb-3">
          {(['region', 'price'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setColorMode(mode)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                colorMode === mode
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mb-2.5 uppercase tracking-widest font-medium">
          {colorMode === 'price' ? 'Est. from India ₹' : 'Regions'}
        </p>
        <div className="space-y-1.5">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
