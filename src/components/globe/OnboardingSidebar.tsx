'use client';

import { useState, useMemo } from 'react';
import { COUNTRIES_DATA } from '@/data/countries';
import { getAllDestinations } from '@/data/destinations';
import { Destination, LatLng } from '@/types';
import LocationInput, { INDIA_CITIES } from './LocationInput';

interface Props {
  onSelectDestination: (dest: Destination, onboardingData: { days: number; month: string }) => void;
  onOriginSet: (iata: string, coords: LatLng) => void;
  originIata: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Haversine distance formula to calculate distance between two coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function OnboardingSidebar({ onSelectDestination, onOriginSet, originIata }: Props) {
  const [days, setDays] = useState<number>(7);
  const [budgetInput, setBudgetInput] = useState<string>('150000'); // Default 1.5 Lakhs
  const [month, setMonth] = useState<string>('Dec');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const budget = parseFloat(budgetInput) || 0;
  const destinationsList = getAllDestinations();

  // Find origin city details dynamically
  const originCity = useMemo(() => {
    return INDIA_CITIES.find((c) => c.iata === originIata) || INDIA_CITIES[0];
  }, [originIata]);

  // Calculate dynamic recommendations based on input parameters (Days, Month, Origin Airport)
  const recommendations = useMemo(() => {
    return COUNTRIES_DATA.map((c) => {
      // Find the first city coordinate of the destination country to calculate flight distance
      const firstCityId = c.cityIds[0];
      const destCity = destinationsList.find((d) => d.id === firstCityId);
      
      let flightCost = c.baseFlightCost; // fallback
      if (destCity && originCity) {
        const distance = getDistance(
          originCity.coords.lat,
          originCity.coords.lng,
          destCity.coords.lat,
          destCity.coords.lng
        );
        // Dynamic estimate: 6.5 INR per km + 8000 base airport taxes/duties
        flightCost = Math.round(distance * 6.5 + 8000);
      }

      const estimatedCost = flightCost + c.dailyCost * days;
      const isIdeal = c.bestMonths.includes(month);

      return {
        ...c,
        flightCost,
        estimatedCost,
        isIdeal,
      };
    }).sort((a, b) => {
      // Prioritize Ideal Month destinations at the top
      if (a.isIdeal && !b.isIdeal) return -1;
      if (!a.isIdeal && b.isIdeal) return 1;
      // Secondary sorting: cheapest estimated cost first
      return a.estimatedCost - b.estimatedCost;
    });
  }, [days, month, originCity, destinationsList]);

  // Filter recommendations based on budget threshold
  const { fitting, exceeding } = useMemo(() => {
    const fit: typeof recommendations = [];
    const exc: typeof recommendations = [];
    recommendations.forEach((r) => {
      if (r.estimatedCost <= budget) {
        fit.push(r);
      } else {
        exc.push(r);
      }
    });
    return { fitting: fit, exceeding: exc };
  }, [recommendations, budget]);

  const activeList = showAll ? recommendations : fitting;

  const handleCountrySelect = (countryName: string) => {
    setSelectedCountry(selectedCountry === countryName ? null : countryName);
  };

  const getCitiesForCountry = (country: typeof COUNTRIES_DATA[0]) => {
    return country.cityIds
      .map((id) => destinationsList.find((d) => d.id === id))
      .filter((d): d is Destination => d !== undefined);
  };

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="absolute left-6 top-6 bottom-6 w-[400px] z-20 bg-secondary-bg border border-border-color rounded-2xl flex flex-col overflow-hidden shadow-2xl">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-border-color flex-shrink-0">
        <h1 className="text-xl font-black text-primary-text flex items-center gap-1">
          journey<span className="text-accent-color">er</span>
        </h1>
        <p className="text-secondary-text text-[11px] mt-1">Set your trip constraints to find matching countries</p>
      </div>

      {/* Scrollable Form + Recommendations */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
        
        {/* Form Fields (Opaque variables to avoid Tailwind opacity evaluation on hex colors) */}
        <div className="space-y-4 bg-card-bg border border-border-color p-4 rounded-xl">
          
          {/* Departing From Dropdown */}
          <div className="space-y-1 relative">
            <p className="text-[10px] text-secondary-text uppercase tracking-widest font-bold">
              Departing From
            </p>
            <LocationInput onOriginSet={onOriginSet} currentIata={originIata} inline={true} />
          </div>

          {/* Days Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-secondary-text uppercase tracking-widest font-bold">
                Trip Duration
              </label>
              <span className="text-xs text-accent-color font-bold">{days} Days</span>
            </div>
            <div className="flex items-center gap-3 bg-secondary-bg border border-border-color rounded-xl px-3 py-2 text-xs">
              <button
                type="button"
                onClick={() => setDays(Math.max(3, days - 1))}
                className="w-6 h-6 rounded bg-card-bg border border-border-color hover:bg-accent-color hover:text-white flex items-center justify-center font-bold text-secondary-text transition-colors"
              >
                -
              </button>
              <input
                type="range"
                min="3"
                max="30"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="flex-1 accent-accent-color bg-primary-bg h-1 rounded-lg appearance-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setDays(Math.min(30, days + 1))}
                className="w-6 h-6 rounded bg-card-bg border border-border-color hover:bg-accent-color hover:text-white flex items-center justify-center font-bold text-secondary-text transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Budget Input & Presets */}
          <div className="space-y-2">
            <label className="text-[10px] text-secondary-text uppercase tracking-widest font-bold">
              Budget / Person (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text font-semibold text-xs">₹</span>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full bg-secondary-bg border border-border-color rounded-xl pl-6 pr-3 py-2 text-primary-text placeholder-secondary-text text-xs focus:outline-none focus:border-accent-color/50 transition-all font-semibold"
                placeholder="Enter budget..."
              />
            </div>
            {/* Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '50k', val: 50000 },
                { label: '1L', val: 100000 },
                { label: '2L', val: 200000 },
                { label: '5L', val: 500000 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setBudgetInput(String(preset.val))}
                  className={`py-1.5 text-[10px] rounded-lg font-bold transition-all border ${
                    budget === preset.val
                      ? 'bg-accent-color border-accent-color text-white shadow-lg'
                      : 'bg-card-bg border-border-color text-secondary-text hover:bg-secondary-bg hover:text-primary-text'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Month Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-secondary-text uppercase tracking-widest font-bold">
              Approximate Month
            </label>
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-secondary-bg border border-border-color rounded-xl px-3 py-2 text-primary-text text-xs focus:outline-none focus:border-accent-color/50 appearance-none font-medium cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary-text">
                <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Recommended List */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-border-color pb-2">
            <h2 className="text-xs font-bold text-primary-text uppercase tracking-wider">Recommended Countries</h2>
            {exceeding.length > 0 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-[9px] font-bold text-accent-color hover:text-accent-color/80 transition-colors bg-accent-color/10 border border-accent-color/20 px-2 py-0.5 rounded"
              >
                {showAll ? 'Hide Over-Budget' : `Show All (+${exceeding.length})`}
              </button>
            )}
          </div>

          {activeList.length === 0 ? (
            <div className="text-center py-8 bg-card-bg border border-border-color rounded-xl px-4">
              <p className="text-secondary-text text-xs font-semibold">No countries fit this budget</p>
              <p className="text-secondary-text/80 text-[10px] mt-1">
                Try increasing budget or reducing travel days, or click "Show All" above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeList.map((c) => {
                const isSelected = selectedCountry === c.name;
                const isOverBudget = c.estimatedCost > budget;
                const cities = getCitiesForCountry(c);

                return (
                  <div
                    key={c.name}
                    className={`bg-card-bg border rounded-xl transition-all overflow-hidden ${
                      isSelected
                        ? 'border-accent-color bg-secondary-bg'
                        : isOverBudget
                        ? 'border-border-color/30 opacity-50'
                        : 'border-border-color'
                    }`}
                  >
                    {/* Country Header Details */}
                    <div
                      onClick={() => handleCountrySelect(c.name)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-primary-text font-bold truncate">{c.name}</h3>
                          <span className="text-[9px] text-secondary-text font-medium px-1.5 py-0.2 bg-secondary-bg border border-border-color rounded-full">
                            {c.region}
                          </span>
                          {c.isIdeal && (
                            <span className="text-[8px] font-bold text-green-500 bg-green-500/10 border border-green-500/20 px-1.5 py-0.2 rounded-full">
                              ☀️ Ideal Month
                            </span>
                          )}
                        </div>
                        <p className="text-secondary-text text-[10px] leading-relaxed truncate">{c.reason}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className={`font-extrabold ${isOverBudget ? 'text-orange-500' : 'text-accent-color'}`}>
                          {formatCurrency(c.estimatedCost)}
                        </div>
                        <div className="text-secondary-text text-[9px]">Est. Cost</div>
                      </div>
                    </div>

                    {/* Available Cities Selection */}
                    {isSelected && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-border-color/20 bg-primary-bg">
                        <p className="text-[9px] text-secondary-text font-semibold uppercase tracking-wider mb-2">
                          Select a city to fly to:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {cities.map((city) => (
                            <button
                              key={city.id}
                              onClick={() => onSelectDestination(city, { days, month })}
                              className="px-2.5 py-1.5 bg-card-bg hover:bg-accent-color hover:text-white border border-border-color rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <span>📍</span>
                              {city.city}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
