'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { Destination, DateRange, FlightSearchParams } from '@/types';
import { regionColors } from '@/data/destinations';
import { useAmadeusFlights } from '@/hooks/useAmadeusFlights';
import { useActivities } from '@/hooks/useActivities';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useHotels } from '@/hooks/useHotels';
import FlightResults from './FlightResults';
import HotelsPlaceholder from './HotelsPlaceholder';
import ActivitiesPanel from './ActivitiesPanel';
import ItineraryTabContent from './ItineraryTabContent';
import FinancePlanner from './FinancePlanner';
import AddContentModal from './AddContentModal';
import RecommendationsTabContent from './RecommendationsTabContent';
import { useItinerary } from '@/context/ItineraryContext';
import { useTheme } from '@/context/ThemeContext';

type LeftPanelTab = 'flights' | 'hotels' | 'activities' | 'restaurants' | 'recommendations' | 'itinerary';
type RightPanelTab = 'map' | 'finance';

const DestinationMap = dynamic(() => import('./DestinationMap'), { ssr: false });

interface Props {
  originIata: string;
  destination: Destination;
  dates: DateRange;
  onReset: () => void;
}

export default function DetailView({ originIata, destination, dates, onReset }: Props) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<LeftPanelTab>('flights');
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>('map');
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  
  const { items, videos } = useItinerary();
  const { theme, toggleTheme } = useTheme();

  const searchParams: FlightSearchParams = {
    origin: originIata,
    destination: destination.iataCode,
    departure: format(dates.departure, 'yyyy-MM-dd'),
    returnDate: format(dates.returnDate, 'yyyy-MM-dd'),
  };

  const { flights, isLoading, error } = useAmadeusFlights(searchParams);
  const { activities } = useActivities(destination.city, destination.country);
  const { restaurants, isLoading: resLoading, error: resError } = useRestaurants(
    destination.city,
    destination.country,
    true // Always fetch restaurants since it's a dedicated tab now
  );
  const { hotels } = useHotels(destination.city, destination.country);
  const accentColor = regionColors[destination.region] ?? '#60a5fa';

  const handleShare = async () => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('dest', destination.id);
    url.searchParams.set('dep', format(dates.departure, 'yyyy-MM-dd'));
    url.searchParams.set('ret', format(dates.returnDate, 'yyyy-MM-dd'));
    url.searchParams.set('from', originIata);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Copy this trip link:', url.toString());
    }
  };

  // Determine map mode based on active tab
  const getMapTabMode = (): 'activities' | 'restaurants' | 'itinerary' | 'hotels' => {
    if (activeTab === 'restaurants') return 'restaurants';
    if (activeTab === 'itinerary') return 'itinerary';
    if (activeTab === 'hotels') return 'hotels';
    return 'activities'; // flights, attractions, recommendations all show attractions on map
  };

  const recommendationsCount = videos.reduce((acc, v) => acc + v.places.length, 0);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-primary-bg">

      {/* Left Panel */}
      <div className="w-1/2 flex flex-col h-full border-r border-border-color overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border-color">
          <div className="flex items-start justify-between">

            {/* Left: back + title */}
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <button onClick={onReset} className="text-secondary-text hover:text-primary-text transition-colors" title="Back to globe">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold text-primary-text">journey<span className="text-accent-color">er</span></h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                <span className="text-primary-text font-semibold text-sm">{destination.city}</span>
                <span className="text-secondary-text text-sm">{destination.country}</span>
              </div>
            </div>

            {/* Right: itinerary + trip summary + share */}
            <div className="text-right flex flex-col items-end gap-1.5">
              <div className="text-secondary-text text-xs">
                <span className="font-medium text-primary-text">{originIata}</span>
                <span className="mx-1.5">→</span>
                <span className="font-medium text-primary-text">{destination.iataCode}</span>
              </div>
              <div className="text-secondary-text/80 text-xs">
                {format(dates.departure, 'MMM d')} – {format(dates.returnDate, 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-2">
                
                {/* Add Content Button */}
                <button
                  onClick={() => setIsAddContentOpen(true)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border bg-card-bg border-border-color text-secondary-text hover:text-primary-text hover:bg-secondary-bg transition-all font-semibold shadow-sm"
                >
                  <span>➕</span> Add Content
                </button>

                {/* Itinerary button */}
                <button
                  onClick={() => setActiveTab('itinerary')}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border bg-card-bg border-border-color text-secondary-text hover:text-primary-text hover:bg-secondary-bg transition-all relative ${
                    activeTab === 'itinerary' ? 'border-accent-color text-primary-text bg-accent-color/10' : ''
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Itinerary
                  {items.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-color rounded-full text-[9px] text-white flex items-center justify-center font-bold shadow">
                      {items.length}
                    </span>
                  )}
                </button>

                {/* Share button */}
                <button
                  onClick={handleShare}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    copied
                      ? 'bg-green-500/10 border-green-500/30 text-green-500 font-bold'
                      : 'bg-card-bg border-border-color text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </>
                  )}
                </button>

                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center p-1.5 rounded-lg border bg-card-bg border-border-color text-secondary-text hover:text-accent-color hover:bg-secondary-bg transition-all shadow-sm"
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? (
                    /* Sun Icon */
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                  ) : (
                    /* Moon Icon */
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>

              </div>
            </div>

          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex-shrink-0 px-6 border-b border-border-color flex items-center gap-1 overflow-x-auto py-2.5 bg-secondary-bg/10">
          {[
            { id: 'flights', label: 'Flights', icon: '✈️' },
            { id: 'hotels', label: 'Hotels', icon: '🏨' },
            { id: 'activities', label: 'Attractions', icon: '📍' },
            { id: 'restaurants', label: 'Restaurant/Cafes', icon: '🍽' },
            { id: 'recommendations', label: 'Recommendations', icon: '✨', count: recommendationsCount },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as LeftPanelTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap relative ${
                activeTab === t.id
                  ? 'bg-secondary-bg text-primary-text border border-border-color'
                  : 'text-secondary-text hover:text-primary-text border border-transparent animate-none'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-accent-color/10 text-accent-color border border-accent-color/20 rounded text-[9px] font-extrabold leading-none">
                  {t.count}
                </span>
              )}
            </button>
          ))}
          
          {/* Highlighted Itinerary Tab */}
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ml-auto whitespace-nowrap ${
              activeTab === 'itinerary'
                ? 'bg-accent-color text-white shadow-lg shadow-accent-color/20'
                : 'bg-accent-color/10 border border-accent-color/20 text-accent-color hover:text-white hover:bg-accent-color/30'
            }`}
          >
            <span>📅</span>
            Itinerary
            {items.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-white text-accent-color rounded-full font-extrabold leading-none min-w-[16px] text-center">
                {items.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin bg-primary-bg">
          {activeTab === 'flights' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <h2 className="text-primary-text text-sm font-semibold">Flights</h2>
                <span className="text-secondary-text text-xs">up to 2 stops</span>
              </div>
              <FlightResults
                flights={flights}
                isLoading={isLoading}
                error={error}
                origin={originIata}
                destination={destination.iataCode}
              />
            </div>
          )}

          {activeTab === 'hotels' && (
            <HotelsPlaceholder destination={destination} />
          )}

          {activeTab === 'activities' && (
            <ActivitiesPanel
              destination={destination}
              activities={activities}
              restaurants={restaurants}
              resLoading={resLoading}
              resError={resError}
              tab="activities"
              onTabChange={() => {}}
              hideToggle={true}
            />
          )}

          {activeTab === 'restaurants' && (
            <ActivitiesPanel
              destination={destination}
              activities={activities}
              restaurants={restaurants}
              resLoading={resLoading}
              resError={resError}
              tab="restaurants"
              onTabChange={() => {}}
              hideToggle={true}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationsTabContent />
          )}

          {activeTab === 'itinerary' && (
            <ItineraryTabContent
              destination={destination}
              dates={dates}
            />
          )}
        </div>
      </div>

      {/* Right Panel — Map or Finance Planner */}
      <div className="w-1/2 flex flex-col h-full overflow-hidden bg-primary-bg">
        
        {/* Right Tab Bar */}
        <div className="flex-shrink-0 px-6 border-b border-border-color flex items-center gap-1 py-2.5 bg-secondary-bg/10">
          {[
            { id: 'map', label: 'Interactive Map', icon: '🗺️' },
            { id: 'finance', label: 'Finance Planner', icon: '💳' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveRightTab(t.id as RightPanelTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeRightTab === t.id
                  ? 'bg-secondary-bg text-primary-text border border-border-color'
                  : 'text-secondary-text hover:text-primary-text border border-transparent'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeRightTab === 'map' ? (
          <div className="flex-1 relative overflow-hidden">
            <DestinationMap
              destination={destination}
              activities={activities}
              restaurants={restaurants}
              hotels={hotels}
              tab={getMapTabMode()}
            />
            <div className="absolute top-4 left-4 z-[1000] bg-secondary-bg/90 backdrop-blur border border-border-color rounded-xl px-3 py-2 pointer-events-none shadow-md">
              <p className="text-primary-text text-xs font-semibold">{destination.city}</p>
              <p className="text-secondary-text text-xs">
                {activeTab === 'restaurants'
                  ? `${restaurants.length} restaurants & cafes`
                  : activeTab === 'itinerary'
                  ? `${items.length} items in itinerary`
                  : activeTab === 'hotels'
                  ? `${hotels.length} hotels`
                  : activities.length > 0 ? `${activities.length} attractions` : `${destination.touristSpots.length} attractions`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin bg-primary-bg">
            <FinancePlanner destination={destination} dates={dates} />
          </div>
        )}
      </div>

      {/* ── Add Content Modal ────────────────────────────────── */}
      <AddContentModal
        isOpen={isAddContentOpen}
        onClose={() => setIsAddContentOpen(false)}
        onSuccess={() => setActiveTab('recommendations')}
      />

    </div>
  );
}