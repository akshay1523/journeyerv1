'use client';

import { useState } from 'react';
import { Destination, LatLng, RecentSearch } from '@/types';
import { getAllDestinations, regionColors, PRICE_LEGEND } from '@/data/destinations';
import GlobeScene from './GlobeScene';
import RecentlyViewed from './RecentlyViewed';
import OnboardingSidebar from './OnboardingSidebar';
import { useTheme } from '@/context/ThemeContext';

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
    <div className="relative w-full h-screen bg-primary-bg overflow-hidden">

      {/* ── Top Right Stats & Theme Toggle ─────────────────── */}
      <div className="absolute top-0 right-0 z-10 px-8 pt-7 pb-4 flex items-center gap-4 select-none">
        <div className="text-right pointer-events-none">
          <p className="text-primary-text text-sm font-semibold">{destinations.length} Destinations</p>
          <p className="text-secondary-text text-xs">Explore and select a country to begin</p>
        </div>
        <button
          onClick={toggleTheme}
          className="pointer-events-auto bg-card-bg hover:bg-secondary-bg border border-border-color rounded-xl p-2.5 text-primary-text hover:text-accent-color transition-colors shadow-md flex items-center justify-center"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            /* Sun Icon */
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            /* Moon Icon */
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Onboarding Sidebar Card (Floating Left) ─────────── */}
      <OnboardingSidebar
        onSelectDestination={onDestinationSelect}
        onOriginSet={onOriginSet}
        originIata={originIata}
      />

      {/* ── Globe ────────────────────────────────────────────── */}
      <GlobeScene
        destinations={destinations}
        onDestinationSelect={(d) => {
          onDestinationSelect(d, { days: 7, month: 'Dec' });
        }}
        colorMode={colorMode}
      />

      {/* ── Recently Viewed ──────────────────────────────────── */}
      <RecentlyViewed searches={recentSearches} onSelect={onRecentSelect} />

      {/* ── Legend + color mode toggle ───────────────────────── */}
      <div className="absolute bottom-8 right-8 z-20 bg-card-bg backdrop-blur border border-border-color rounded-xl p-4">
        {/* Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-border-color mb-3">
          <button
            onClick={() => setColorMode('region')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              colorMode === 'region'
                ? 'bg-secondary-bg text-primary-text'
                : 'text-secondary-text hover:text-primary-text'
            }`}
          >
            Region
          </button>
          <button
            onClick={() => setColorMode('price')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              colorMode === 'price'
                ? 'bg-secondary-bg text-primary-text'
                : 'text-secondary-text hover:text-primary-text'
            }`}
          >
            Price
          </button>
        </div>

        <p className="text-xs text-secondary-text mb-2.5 uppercase tracking-widest font-medium">
          {colorMode === 'price' ? 'Est. from India ₹' : 'Regions'}
        </p>
        <div className="space-y-1.5">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-primary-text">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
