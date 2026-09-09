'use client';

import { useState, useEffect } from 'react';
import { differenceInDays, format } from 'date-fns';
import { Destination, DateRange } from '@/types';
import { useItinerary } from '@/context/ItineraryContext';
import { COUNTRIES_DATA } from '@/data/countries';

interface Props {
  destination: Destination;
  dates: DateRange;
}

const COUNTRY_CURRENCY_MAP: Record<string, { code: string; name: string }> = {
  'Thailand': { code: 'THB', name: 'Thai Baht' },
  'Vietnam': { code: 'VND', name: 'Vietnamese Dong' },
  'Indonesia': { code: 'IDR', name: 'Indonesian Rupiah' },
  'Singapore': { code: 'SGD', name: 'Singapore Dollar' },
  'UAE': { code: 'AED', name: 'UAE Dirham' },
  'Israel': { code: 'ILS', name: 'Israeli New Shekel' },
  'France': { code: 'EUR', name: 'Euro' },
  'Italy': { code: 'EUR', name: 'Euro' },
  'Switzerland': { code: 'CHF', name: 'Swiss Franc' },
  'Greece': { code: 'EUR', name: 'Euro' },
  'Spain': { code: 'EUR', name: 'Euro' },
  'Germany': { code: 'EUR', name: 'Euro' },
  'Netherlands': { code: 'EUR', name: 'Euro' },
  'United Kingdom': { code: 'GBP', name: 'British Pound' },
  'Portugal': { code: 'EUR', name: 'Euro' },
  'Ireland': { code: 'EUR', name: 'Euro' },
  'Japan': { code: 'JPY', name: 'Japanese Yen' },
  'South Korea': { code: 'KRW', name: 'South Korean Won' },
  'China': { code: 'CNY', name: 'Chinese Yuan' },
  'Morocco': { code: 'MAD', name: 'Moroccan Dirham' },
  'Australia': { code: 'AUD', name: 'Australian Dollar' },
  'New Zealand': { code: 'NZD', name: 'New Zealand Dollar' },
  'Mexico': { code: 'MXN', name: 'Mexican Peso' },
  'Canada': { code: 'CAD', name: 'Canadian Dollar' },
  'Colombia': { code: 'COP', name: 'Colombian Peso' },
  'Brazil': { code: 'BRL', name: 'Brazilian Real' },
  'Costa Rica': { code: 'CRC', name: 'Costa Rican Colón' },
  'Peru': { code: 'PEN', name: 'Peruvian Sol' },
  'Jamaica': { code: 'JMD', name: 'Jamaican Dollar' },
  'Bahamas': { code: 'BSD', name: 'Bahamian Dollar' },
  'Dominican Republic': { code: 'DOP', name: 'Dominican Peso' },
};

const SUPPORTED_CURRENCIES = new Set([
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'IDR', 'ILS', 'JPY', 'KRW', 'MXN', 'NZD', 'SGD', 'THB', 'USD', 'INR'
]);

interface RecommendedCard {
  card_name: string;
  bank: string;
  best_for: string;
  why_for_this_trip: string;
  forex_fee: string;
  key_benefit: string;
  apply_url: string;
}

export default function FinancePlanner({ destination, dates }: Props) {
  const { items } = useItinerary();
  
  // Rate states
  const [rate, setRate] = useState<number | null>(null);
  const [change, setChange] = useState<number>(0);
  const [rateLoading, setRateLoading] = useState<boolean>(true);
  const [rateError, setRateError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Card recommendations states
  const [cards, setCards] = useState<RecommendedCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState<boolean>(true);
  const [cardsError, setCardsError] = useState<string | null>(null);

  const currencyInfo = COUNTRY_CURRENCY_MAP[destination.country] || { code: 'USD', name: 'US Dollar' };
  const currencyCode = currencyInfo.code;
  const tripDays = differenceInDays(dates.returnDate, dates.departure) || 7;

  // Calculate estimated total cost from COUNTRY_DATA for Gemini context
  const countryCostData = COUNTRIES_DATA.find((c) => c.name === destination.country) || COUNTRIES_DATA[0];
  const estimatedTotalCost = countryCostData.baseFlightCost + countryCostData.dailyCost * tripDays;
  const travelMonth = format(dates.departure, 'MMM');

  // Load Exchange Rate
  useEffect(() => {
    let active = true;

    async function loadExchangeRate() {
      setRateLoading(true);
      setRateError(null);

      if (!SUPPORTED_CURRENCIES.has(currencyCode)) {
        setTimeout(() => {
          if (!active) return;
          let mockRate = 0.012;
          let mockChange = 0.05;
          if (currencyCode === 'AED') { mockRate = 0.044; mockChange = 0.06; }
          else if (currencyCode === 'VND') { mockRate = 304.2; mockChange = -0.12; }
          else if (currencyCode === 'MAD') { mockRate = 0.121; mockChange = 0.02; }
          else if (currencyCode === 'COP') { mockRate = 48.5; mockChange = -0.25; }
          else if (currencyCode === 'BRL') { mockRate = 0.065; mockChange = 0.18; }
          
          setRate(mockRate);
          setChange(mockChange);
          setIsOffline(true);
          setRateLoading(false);
          setLastUpdated(new Date());
        }, 800);
        return;
      }

      try {
        const latestRes = await fetch(`https://api.frankfurter.app/latest?from=INR&to=${currencyCode}`);
        if (!latestRes.ok) throw new Error('Failed to fetch latest rate');
        const latestData = await latestRes.json();
        const currentRate = latestData.rates[currencyCode];
        const dateStr = latestData.date;

        const dateObj = new Date(dateStr);
        dateObj.setDate(dateObj.getDate() - 1);
        const prevDateStr = dateObj.toISOString().split('T')[0];

        const prevRes = await fetch(`https://api.frankfurter.app/${prevDateStr}?from=INR&to=${currencyCode}`);
        if (!prevRes.ok) {
          setRate(currentRate);
          setChange(0.04);
        } else {
          const prevData = await prevRes.json();
          const prevRate = prevData.rates[currencyCode] || currentRate;
          const percentChange = ((currentRate - prevRate) / prevRate) * 100;
          setRate(currentRate);
          setChange(percentChange);
        }
        
        setIsOffline(false);
        setRateLoading(false);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Frankfurter API failed, using local offline fallback rates:', err);
        // Offline rates fallback lookup
        let fallbackRate = 0.012;
        let fallbackChange = 0.04;
        
        if (currencyCode === 'THB') { fallbackRate = 0.44; fallbackChange = 0.08; }
        else if (currencyCode === 'VND') { fallbackRate = 304.2; fallbackChange = -0.12; }
        else if (currencyCode === 'IDR') { fallbackRate = 198.5; fallbackChange = 0.08; }
        else if (currencyCode === 'SGD') { fallbackRate = 0.016; fallbackChange = -0.02; }
        else if (currencyCode === 'AED') { fallbackRate = 0.044; fallbackChange = 0.06; }
        else if (currencyCode === 'ILS') { fallbackRate = 0.045; fallbackChange = 0.01; }
        else if (currencyCode === 'EUR') { fallbackRate = 0.011; fallbackChange = 0.03; }
        else if (currencyCode === 'GBP') { fallbackRate = 0.009; fallbackChange = -0.01; }
        else if (currencyCode === 'JPY') { fallbackRate = 1.92; fallbackChange = -0.05; }
        else if (currencyCode === 'KRW') { fallbackRate = 16.5; fallbackChange = 0.12; }
        else if (currencyCode === 'CNY') { fallbackRate = 0.087; fallbackChange = -0.03; }
        else if (currencyCode === 'MAD') { fallbackRate = 0.121; fallbackChange = 0.02; }
        else if (currencyCode === 'AUD') { fallbackRate = 0.018; fallbackChange = 0.05; }
        else if (currencyCode === 'NZD') { fallbackRate = 0.019; fallbackChange = 0.06; }
        else if (currencyCode === 'MXN') { fallbackRate = 0.21; fallbackChange = 0.04; }
        else if (currencyCode === 'CAD') { fallbackRate = 0.016; fallbackChange = 0.02; }
        else if (currencyCode === 'BRL') { fallbackRate = 0.065; fallbackChange = 0.18; }
        
        setRate(fallbackRate);
        setChange(fallbackChange);
        setIsOffline(true);
        setRateError(null);
        setRateLoading(false);
        setLastUpdated(new Date());
      }
    }

    loadExchangeRate();
    const interval = setInterval(loadExchangeRate, 60000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [currencyCode]);

  // Fetch Card Recommendations with Cache
  useEffect(() => {
    let active = true;
    const cacheKey = `cards-recommendation-${destination.country}-${tripDays}-${estimatedTotalCost}`;

    async function loadCardRecommendations() {
      setCardsLoading(true);
      setCardsError(null);

      // Check LocalStorage cache first
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setCards(JSON.parse(cached));
          setCardsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to read cards cache:', err);
      }

      // Fetch from API
      try {
        const res = await fetch('/api/recommend-cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            country: destination.country,
            days: tripDays,
            amount: estimatedTotalCost,
            count: 2, // assume 2 travellers
            month: travelMonth,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to fetch card recommendations');
        }

        const json = await res.json();
        const data = json.data || [];

        if (!active) return;

        setCards(data);
        
        // Save to cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
          console.warn('Failed to write cards cache:', e);
        }
        
        setCardsLoading(false);
      } catch (err) {
        console.error(err);
        if (active) {
          setCardsError('Could not fetch credit card recommendations.');
          setCardsLoading(false);
        }
      }
    }

    loadCardRecommendations();

    return () => {
      active = false;
    };
  }, [destination.country, tripDays, estimatedTotalCost, travelMonth]);

  // Platforms calculations
  const hasFlights = items.some(i => i.type === 'flight');
  const hasHotels = items.some(i => i.type === 'hotel');
  const hasAttractions = items.some(i => i.type === 'activity');
  const hasRestaurants = items.some(i => i.id.startsWith('restaurant-'));
  const noItems = items.length === 0;

  return (
    <div className="space-y-6 h-full pb-10">
      
      {/* ── Section 1: Live Currency Exchange ──────────────── */}
      <div className="bg-card-bg border border-border-color rounded-xl p-4">
        <h3 className="text-primary-text text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span>💱</span> Live Currency Exchange
        </h3>
        
        {rateLoading && !rate ? (
          <div className="animate-pulse space-y-2 py-2">
            <div className="h-6 bg-secondary-bg rounded w-1/2" />
            <div className="h-4 bg-secondary-bg rounded w-3/4" />
          </div>
        ) : rateError ? (
          <p className="text-rose-400 text-xs py-1">⚠️ {rateError}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-secondary-text font-semibold">1 INR =</span>
                <div className="text-xl font-black text-primary-text mt-0.5">
                  {rate?.toLocaleString('en-IN', { maximumFractionDigits: 6 })} <span className="text-accent-color text-sm font-bold">{currencyCode}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-secondary-text font-semibold">1 {currencyCode} =</span>
                <div className="text-sm font-bold text-primary-text mt-0.5">
                  {rate ? (1 / rate).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'} <span className="text-secondary-text text-[10px]">INR</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border-color/30 pt-2.5 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="text-secondary-text">24h Change:</span>
                <span className={`font-bold flex items-center ${change >= 0 ? 'text-green-500' : 'text-rose-500'}`}>
                  {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                </span>
              </div>
              <span className="text-secondary-text/80">
                Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {isOffline && '(offline)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Best Cards for This Trip (AI) ──────── */}
      <div className="space-y-3">
        <div>
          <h3 className="text-primary-text text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>💳</span> AI Card Recommendations
          </h3>
          <p className="text-[10px] text-secondary-text mt-0.5">Custom matches for your {tripDays} days trip to {destination.country}</p>
        </div>

        {cardsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card-bg border border-border-color rounded-xl p-4 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-bg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-secondary-bg rounded w-1/3" />
                    <div className="h-2.5 bg-secondary-bg rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-secondary-bg rounded w-5/6 mt-2" />
                <div className="h-3 bg-secondary-bg rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : cardsError ? (
          <p className="text-rose-400 text-xs py-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
            ⚠️ {cardsError}
          </p>
        ) : (
          <div className="space-y-2.5">
            {cards.map((card, index) => {
              const bankInitial = card.bank ? card.bank.trim().charAt(0).toUpperCase() : 'C';
              return (
                <div
                  key={card.card_name + index}
                  className="bg-card-bg border border-border-color hover:border-accent-color/20 rounded-xl p-4 flex flex-col justify-between gap-3.5 transition-all shadow-sm"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      {/* Bank Logo Initial */}
                      <div className="w-10 h-10 rounded-xl bg-accent-color/10 border border-accent-color/20 text-accent-color font-black flex items-center justify-center text-base flex-shrink-0">
                        {bankInitial}
                      </div>
                      
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-primary-text text-xs font-bold leading-tight truncate">
                          {card.card_name}
                        </h4>
                        <span className="text-[9px] text-secondary-text font-medium">
                          {card.bank}
                        </span>
                      </div>

                      {/* Best For tag */}
                      <span className="ml-auto text-[8px] bg-accent-color/10 border border-accent-color/20 px-2 py-0.5 rounded-lg text-accent-color font-black uppercase tracking-wider">
                        {card.best_for}
                      </span>
                    </div>

                    {/* Why for this trip */}
                    <p className="text-secondary-text text-[11px] leading-relaxed italic">
                      "{card.why_for_this_trip}"
                    </p>
                  </div>

                  {/* Forex and key benefit summary */}
                  <div className="border-t border-border-color/30 pt-2.5 space-y-1.5 text-[10px]">
                    <div className="flex justify-between items-baseline">
                      <span className="text-secondary-text">Forex Markup Fee:</span>
                      <span className="font-extrabold text-primary-text text-xs">{card.forex_fee}</span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-secondary-text flex-shrink-0">Key Benefit:</span>
                      <span className="font-semibold text-primary-text text-right max-w-[220px] truncate" title={card.key_benefit}>
                        {card.key_benefit}
                      </span>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <a
                    href={card.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 bg-accent-color hover:bg-accent-color/90 text-white rounded-xl text-center text-xs font-bold transition-all shadow-sm"
                  >
                    Apply Now
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 3: Best Booking Platforms ────────────── */}
      <div className="space-y-3">
        <h3 className="text-primary-text text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span>🌐</span> Recommended Booking Platforms
        </h3>

        <div className="space-y-2">
          {/* Flights Platform */}
          {(hasFlights || noItems) && (
            <div className="bg-card-bg border border-border-color rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-accent-color uppercase tracking-widest">Flights</span>
                <span className="text-[9px] text-secondary-text">Skyscanner · G-Flights</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Skyscanner', desc: 'Best comparisons', promo: 'Compare free' },
                  { name: 'MakeMyTrip', desc: 'Best portal', promo: 'Up to ₹2000 off' },
                  { name: 'Google Flights', desc: 'Best trackers', promo: 'Real-time alerts' },
                ].map(p => (
                  <div key={p.name} className="bg-secondary-bg/60 border border-border-color/30 rounded-lg p-2 text-center text-[10px] flex flex-col justify-between min-h-[70px]">
                    <div className="font-bold text-primary-text truncate">{p.name}</div>
                    <div className="text-[8px] text-green-500 font-bold mt-1 bg-green-500/10 py-0.5 rounded truncate">{p.promo}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hotels Platform */}
          {(hasHotels || noItems) && (
            <div className="bg-card-bg border border-border-color rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-accent-color uppercase tracking-widest">Hotels</span>
                <span className="text-[9px] text-secondary-text">Booking.com · Agoda</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    name: 'Booking.com',
                    desc: 'Best overall inventory',
                    promo: 'Genius Discount',
                    badge: null
                  },
                  {
                    name: 'Agoda',
                    desc: 'Best deals in Asia',
                    promo: 'Agoda Special Rate',
                    badge: ['Southeast Asia', 'East Asia', 'Asia Nearby'].includes(destination.region) ? 'Top pick for Asia' : null
                  },
                ].map(p => (
                  <div key={p.name} className="bg-secondary-bg/60 border border-border-color/30 rounded-lg p-2 text-[10px] relative flex flex-col justify-between min-h-[75px]">
                    {p.badge && (
                      <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-green-500 text-white text-[7px] font-black uppercase rounded-full">
                        {p.badge}
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-primary-text">{p.name}</div>
                      <div className="text-[9px] text-secondary-text mt-0.5 leading-snug">{p.desc}</div>
                    </div>
                    <div className="text-[8px] text-green-500 font-bold mt-1 bg-green-500/10 py-0.5 px-1 rounded inline-block w-fit">{p.promo}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attractions Platform */}
          {(hasAttractions || noItems) && (
            <div className="bg-card-bg border border-border-color rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-accent-color uppercase tracking-widest">Attractions</span>
                <span className="text-[9px] text-secondary-text">Klook · GetYourGuide</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Klook', desc: 'Best for Asia', promo: 'FIRSTKLOOK' },
                  { name: 'GetYourGuide', desc: 'Best for Europe', promo: 'Free cancel' },
                  { name: 'Headout', desc: 'Last-minute', promo: 'Up to 10% off' },
                ].map(p => (
                  <div key={p.name} className="bg-secondary-bg/60 border border-border-color/30 rounded-lg p-2 text-center text-[10px] flex flex-col justify-between min-h-[70px]">
                    <div className="font-bold text-primary-text truncate">{p.name}</div>
                    <div className="text-[8px] text-green-500 font-bold mt-1 bg-green-500/10 py-0.5 rounded truncate">{p.promo}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restaurants Platform */}
          {(hasRestaurants || noItems) && (
            <div className="bg-card-bg border border-border-color rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-accent-color uppercase tracking-widest">Dining</span>
                <span className="text-[9px] text-secondary-text">TheFork · Maps Bookings</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    name: 'TheFork',
                    desc: 'European reservations',
                    promo: 'Up to 50% off bill',
                    highlight: destination.region === 'Europe'
                  },
                  {
                    name: 'Google Maps / Local',
                    desc: 'Search local bookings',
                    promo: 'Direct reservation',
                    highlight: destination.region !== 'Europe'
                  },
                ].map(p => (
                  <div key={p.name} className={`border p-2 rounded-lg text-[10px] flex flex-col justify-between min-h-[75px] ${p.highlight ? 'bg-accent-color/5 border-accent-color/25' : 'bg-secondary-bg/60 border-border-color/30'}`}>
                    <div>
                      <div className="font-bold text-primary-text flex items-center gap-1">
                        {p.name}
                        {p.highlight && <span className="w-1.5 h-1.5 rounded-full bg-accent-color" />}
                      </div>
                      <div className="text-[9px] text-secondary-text mt-0.5 leading-snug">{p.desc}</div>
                    </div>
                    <div className="text-[8px] text-green-500 font-bold mt-1 bg-green-500/10 py-0.5 px-1 rounded inline-block w-fit">{p.promo}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
