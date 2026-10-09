'use client';

import { useState, useMemo } from 'react';
import { COUNTRIES_DATA } from '@/data/countries';
import { getAllDestinations } from '@/data/destinations';
import { Destination, LatLng } from '@/types';
import LocationInput, { INDIA_CITIES } from './LocationInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onSelectDestination: (dest: Destination, onboardingData: { days: number; month: string }) => void;
  onOriginSet: (iata: string, coords: LatLng) => void;
  originIata: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
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
  const [budgetInput, setBudgetInput] = useState<string>('150000');
  const [month, setMonth] = useState<string>('Dec');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const budget = parseFloat(budgetInput) || 0;
  const destinationsList = getAllDestinations();

  const originCity = useMemo(() => {
    return INDIA_CITIES.find((c) => c.iata === originIata) || INDIA_CITIES[0];
  }, [originIata]);

  const recommendations = useMemo(() => {
    return COUNTRIES_DATA.map((c) => {
      const firstCityId = c.cityIds[0];
      const destCity = destinationsList.find((d) => d.id === firstCityId);

      let flightCost = c.baseFlightCost;
      if (destCity && originCity) {
        const distance = getDistance(originCity.coords.lat, originCity.coords.lng, destCity.coords.lat, destCity.coords.lng);
        flightCost = Math.round(distance * 6.5 + 8000);
      }

      const estimatedCost = flightCost + c.dailyCost * days;
      const isIdeal = c.bestMonths.includes(month);

      return { ...c, flightCost, estimatedCost, isIdeal };
    }).sort((a, b) => {
      if (a.isIdeal && !b.isIdeal) return -1;
      if (!a.isIdeal && b.isIdeal) return 1;
      return a.estimatedCost - b.estimatedCost;
    });
  }, [days, month, originCity, destinationsList]);

  const { fitting, exceeding } = useMemo(() => {
    const fit: typeof recommendations = [];
    const exc: typeof recommendations = [];
    recommendations.forEach((r) => {
      if (r.estimatedCost <= budget) fit.push(r);
      else exc.push(r);
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

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="absolute left-6 top-6 bottom-6 w-[400px] z-20 backdrop-blur-md bg-background/90 border border-border/60 rounded-2xl flex flex-col overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-border/40 flex-shrink-0">
        <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-1">
          journey<span className="text-primary">er</span>
        </h1>
        <p className="text-muted-foreground text-[11px] mt-1">Set your trip constraints to find matching countries</p>
      </div>

      {/* Scrollable Form + Recommendations */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">

        {/* Form Card */}
        <div className="space-y-4 bg-muted/30 border border-border/40 p-4 rounded-xl">

          {/* Departing From */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Departing From</p>
            <LocationInput onOriginSet={onOriginSet} currentIata={originIata} inline={true} />
          </div>

          {/* Days Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Trip Duration</label>
              <span className="text-xs text-primary font-bold">{days} Days</span>
            </div>
            <div className="flex items-center gap-3 bg-background/60 border border-border/40 rounded-lg px-3 py-2 text-xs">
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDays(Math.max(3, days - 1))}>
                <span className="font-bold text-sm">-</span>
              </Button>
              <input
                type="range"
                min="3"
                max="30"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="flex-1 accent-blue-500 h-1 rounded-lg appearance-none cursor-pointer bg-muted"
              />
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDays(Math.min(30, days + 1))}>
                <span className="font-bold text-sm">+</span>
              </Button>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Budget / Person (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
              <Input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="pl-6 h-9 text-xs font-semibold bg-background/60"
                placeholder="Enter budget..."
              />
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '50k', val: 50000 },
                { label: '1L', val: 100000 },
                { label: '2L', val: 200000 },
                { label: '5L', val: 500000 },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant={budget === preset.val ? 'default' : 'outline'}
                  size="xs"
                  className="h-7 text-[10px] font-bold"
                  onClick={() => setBudgetInput(String(preset.val))}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Month */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Approximate Month</label>
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-background/60 border border-input rounded-md px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none cursor-pointer font-medium"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute inset-y-0 right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Recommended Countries</h2>
            {exceeding.length > 0 && (
              <Button variant="outline" size="xs" className="h-6 text-[9px] font-bold" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Hide Over-Budget' : `Show All (+${exceeding.length})`}
              </Button>
            )}
          </div>
          <Separator />

          {activeList.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 border border-border/40 rounded-xl px-4">
              <p className="text-muted-foreground text-xs font-semibold">No countries fit this budget</p>
              <p className="text-muted-foreground/70 text-[10px] mt-1">
                Try increasing budget or reducing travel days.
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
                    className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : isOverBudget
                        ? 'border-border/30 opacity-50'
                        : 'border-border/60 hover:-translate-y-0.5 hover:shadow-sm'
                    }`}
                  >
                    {/* Country Header */}
                    <div
                      onClick={() => handleCountrySelect(c.name)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-foreground font-bold truncate">{c.name}</h3>
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">{c.region}</Badge>
                          {c.isIdeal && (
                            <Badge variant="success" className="text-[8px] h-4 px-1.5">☀️ Ideal Month</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-[10px] leading-relaxed truncate">{c.reason}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`font-extrabold text-sm ${isOverBudget ? 'text-orange-500' : 'text-primary'}`}>
                          {formatCurrency(c.estimatedCost)}
                        </div>
                        <div className="text-muted-foreground text-[9px]">Est. Cost</div>
                      </div>
                    </div>

                    {/* City Selection */}
                    {isSelected && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-border/20 bg-background/40">
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                          Select a city to fly to:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {cities.map((city) => (
                            <Button
                              key={city.id}
                              variant="outline"
                              size="xs"
                              className="h-7 text-[11px] font-bold"
                              onClick={() => onSelectDestination(city, { days, month })}
                            >
                              <MapPin className="h-3 w-3" />
                              {city.city}
                            </Button>
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
