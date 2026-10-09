'use client';

import React, { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Sun, Moon, Plus, ListTodo, Check, Map, CreditCard, Plane, Hotel, MapPin, Utensils, Sparkles, LayoutList } from 'lucide-react';

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
    true
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

  const getMapTabMode = (): 'activities' | 'restaurants' | 'itinerary' | 'hotels' => {
    if (activeTab === 'restaurants') return 'restaurants';
    if (activeTab === 'itinerary') return 'itinerary';
    if (activeTab === 'hotels') return 'hotels';
    return 'activities';
  };

  const recommendationsCount = videos.reduce((acc, v) => acc + v.places.length, 0);

  const leftTabs: { id: LeftPanelTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
    { id: 'activities', label: 'Attractions', icon: MapPin },
    { id: 'restaurants', label: 'Dining', icon: Utensils },
    { id: 'recommendations', label: 'Recs', icon: Sparkles, count: recommendationsCount },
  ];

  const tabBtnClass = (id: string) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap relative ${
      activeTab === id
        ? 'bg-background text-foreground border border-border/60 shadow-xs'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
    }`;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">

      {/* Left Panel */}
      <div className="w-1/2 flex flex-col h-full border-r border-border/60 overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-border/60 backdrop-blur-md bg-background/90">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReset} title="Back to globe">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-black tracking-tight text-foreground">
                  journey<span style={{ color: accentColor }}>er</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 pl-9">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                <span className="text-foreground font-semibold text-sm">{destination.city}</span>
                <span className="text-muted-foreground text-sm">{destination.country}</span>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-1.5">
              <div className="text-muted-foreground text-xs">
                <span className="font-semibold text-foreground">{originIata}</span>
                <span className="mx-1.5">→</span>
                <span className="font-semibold text-foreground">{destination.iataCode}</span>
              </div>
              <div className="text-muted-foreground/80 text-xs">
                {format(dates.departure, 'MMM d')} – {format(dates.returnDate, 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsAddContentOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
                <Button
                  variant={activeTab === 'itinerary' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs relative"
                  onClick={() => setActiveTab('itinerary')}
                >
                  <ListTodo className="h-3.5 w-3.5" />
                  Itinerary
                  {items.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full text-[9px] text-primary-foreground flex items-center justify-center font-bold">
                      {items.length}
                    </span>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleShare}>
                  {copied ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Share2 className="h-3.5 w-3.5" /> Share</>}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleTheme} title="Toggle theme">
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex-shrink-0 px-5 border-b border-border/60 flex items-center gap-1 overflow-x-auto py-2 bg-muted/20">
          {leftTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as LeftPanelTab)}
              className={tabBtnClass(t.id)}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[9px] font-extrabold leading-none">
                  {t.count}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ml-auto whitespace-nowrap border ${
              activeTab === 'itinerary'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Itinerary
            {items.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-background/20 rounded-full font-extrabold leading-none min-w-[16px] text-center">
                {items.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin bg-background">
          {activeTab === 'flights' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-foreground text-sm font-semibold tracking-tight">Flights</h2>
                <span className="text-muted-foreground text-xs">up to 2 stops</span>
              </div>
              <FlightResults flights={flights} isLoading={isLoading} error={error} origin={originIata} destination={destination.iataCode} />
            </div>
          )}
          {activeTab === 'hotels' && <HotelsPlaceholder destination={destination} />}
          {activeTab === 'activities' && (
            <ActivitiesPanel destination={destination} activities={activities} restaurants={restaurants} resLoading={resLoading} resError={resError} tab="activities" onTabChange={() => {}} hideToggle={true} />
          )}
          {activeTab === 'restaurants' && (
            <ActivitiesPanel destination={destination} activities={activities} restaurants={restaurants} resLoading={resLoading} resError={resError} tab="restaurants" onTabChange={() => {}} hideToggle={true} />
          )}
          {activeTab === 'recommendations' && <RecommendationsTabContent />}
          {activeTab === 'itinerary' && <ItineraryTabContent destination={destination} dates={dates} />}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 flex flex-col h-full overflow-hidden bg-background">
        <div className="flex-shrink-0 px-5 border-b border-border/60 flex items-center gap-1 py-2 bg-muted/20">
          {[
            { id: 'map', label: 'Interactive Map', icon: Map },
            { id: 'finance', label: 'Finance Planner', icon: CreditCard },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveRightTab(t.id as RightPanelTab)}
              className={tabBtnClass(t.id)}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {activeRightTab === 'map' ? (
          <div className="flex-1 relative overflow-hidden">
            <DestinationMap destination={destination} activities={activities} restaurants={restaurants} hotels={hotels} tab={getMapTabMode()} />
            <div className="absolute top-4 left-4 z-[1000] backdrop-blur-md bg-background/80 border border-border/60 rounded-xl px-3 py-2 pointer-events-none shadow-sm">
              <p className="text-foreground text-xs font-semibold">{destination.city}</p>
              <p className="text-muted-foreground text-xs">
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
          <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin bg-background">
            <FinancePlanner destination={destination} dates={dates} />
          </div>
        )}
      </div>

      <AddContentModal isOpen={isAddContentOpen} onClose={() => setIsAddContentOpen(false)} onSuccess={() => setActiveTab('recommendations')} />
    </div>
  );
}
