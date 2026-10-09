'use client';

import { useState, useEffect } from 'react';
import { differenceInDays, format } from 'date-fns';
import { Destination, DateRange } from '@/types';
import { useItinerary } from '@/context/ItineraryContext';
import { COUNTRIES_DATA } from '@/data/countries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

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
  'Costa Rica': { code: 'CRC', name: 'Costa Rican Colon' },
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

  const [rate, setRate] = useState<number | null>(null);
  const [change, setChange] = useState<number>(0);
  const [rateLoading, setRateLoading] = useState<boolean>(true);
  const [rateError, setRateError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const [cards, setCards] = useState<RecommendedCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState<boolean>(true);
  const [cardsError, setCardsError] = useState<string | null>(null);

  const currencyInfo = COUNTRY_CURRENCY_MAP[destination.country] || { code: 'USD', name: 'US Dollar' };
  const currencyCode = currencyInfo.code;
  const tripDays = differenceInDays(dates.returnDate, dates.departure) || 7;

  const countryCostData = COUNTRIES_DATA.find((c) => c.name === destination.country) || COUNTRIES_DATA[0];
  const estimatedTotalCost = countryCostData.baseFlightCost + countryCostData.dailyCost * tripDays;
  const travelMonth = format(dates.departure, 'MMM');

  useEffect(() => {
    let active = true;
    async function loadExchangeRate() {
      setRateLoading(true);
      setRateError(null);
      if (!SUPPORTED_CURRENCIES.has(currencyCode)) {
        setTimeout(() => {
          if (!active) return;
          let mockRate = 0.012; let mockChange = 0.05;
          if (currencyCode === 'AED') { mockRate = 0.044; mockChange = 0.06; }
          else if (currencyCode === 'VND') { mockRate = 304.2; mockChange = -0.12; }
          else if (currencyCode === 'MAD') { mockRate = 0.121; mockChange = 0.02; }
          setRate(mockRate); setChange(mockChange); setIsOffline(true); setRateLoading(false); setLastUpdated(new Date());
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
        if (!prevRes.ok) { setRate(currentRate); setChange(0.04); }
        else {
          const prevData = await prevRes.json();
          const prevRate = prevData.rates[currencyCode] || currentRate;
          setRate(currentRate); setChange(((currentRate - prevRate) / prevRate) * 100);
        }
        setIsOffline(false); setRateLoading(false); setLastUpdated(new Date());
      } catch {
        let fallbackRate = 0.012; let fallbackChange = 0.04;
        if (currencyCode === 'THB') { fallbackRate = 0.44; fallbackChange = 0.08; }
        else if (currencyCode === 'EUR') { fallbackRate = 0.011; fallbackChange = 0.03; }
        else if (currencyCode === 'GBP') { fallbackRate = 0.009; fallbackChange = -0.01; }
        else if (currencyCode === 'JPY') { fallbackRate = 1.92; fallbackChange = -0.05; }
        else if (currencyCode === 'SGD') { fallbackRate = 0.016; fallbackChange = -0.02; }
        if (active) { setRate(fallbackRate); setChange(fallbackChange); setIsOffline(true); setRateLoading(false); setLastUpdated(new Date()); }
      }
    }
    loadExchangeRate();
    const interval = setInterval(loadExchangeRate, 60000);
    return () => { active = false; clearInterval(interval); };
  }, [currencyCode]);

  useEffect(() => {
    let active = true;
    const cacheKey = `cards-recommendation-${destination.country}-${tripDays}-${estimatedTotalCost}`;
    async function loadCardRecommendations() {
      setCardsLoading(true); setCardsError(null);
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) { setCards(JSON.parse(cached)); setCardsLoading(false); return; }
      } catch {}
      try {
        const res = await fetch('/api/recommend-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: destination.country, days: tripDays, amount: estimatedTotalCost, count: 2, month: travelMonth }),
        });
        if (!res.ok) throw new Error('Failed to fetch card recommendations');
        const json = await res.json();
        const data = json.data || [];
        if (!active) return;
        setCards(data);
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        setCardsLoading(false);
      } catch (err) {
        console.error(err);
        if (active) { setCardsError('Could not fetch credit card recommendations.'); setCardsLoading(false); }
      }
    }
    loadCardRecommendations();
    return () => { active = false; };
  }, [destination.country, tripDays, estimatedTotalCost, travelMonth]);

  const hasFlights = items.some(i => i.type === 'flight');
  const hasHotels = items.some(i => i.type === 'hotel');
  const hasAttractions = items.some(i => i.type === 'activity');
  const hasRestaurants = items.some(i => i.id.startsWith('restaurant-'));
  const noItems = items.length === 0;

  return (
    <div className="space-y-6 h-full pb-10">

      {/* Section 1: Live Currency Exchange */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
            💱 Live Currency Exchange
          </h3>
          {rateLoading && !rate ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : rateError ? (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-4 w-4" /> {rateError}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold">1 INR =</span>
                  <div className="text-xl font-black text-foreground mt-0.5">
                    {rate?.toLocaleString('en-IN', { maximumFractionDigits: 6 })} <span className="text-primary text-sm font-bold">{currencyCode}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-semibold">1 {currencyCode} =</span>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {rate ? (1 / rate).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'} <span className="text-muted-foreground text-[10px]">INR</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">24h Change:</span>
                  <span className={`font-bold flex items-center ${change >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                    {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                  </span>
                </div>
                <span className="text-muted-foreground/70">
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {isOffline && '(offline)'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: AI Card Recommendations */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            💳 AI Card Recommendations
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Custom matches for your {tripDays} days trip to {destination.country}</p>
        </div>

        {cardsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/3" />
                      <Skeleton className="h-2.5 w-1/4" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cardsError ? (
          <div className="flex items-center gap-2 text-destructive text-xs p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {cardsError}
          </div>
        ) : (
          <div className="space-y-2.5">
            {cards.map((card, index) => {
              const bankInitial = card.bank ? card.bank.trim().charAt(0).toUpperCase() : 'C';
              return (
                <Card key={card.card_name + index} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black flex items-center justify-center text-base flex-shrink-0">
                        {bankInitial}
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h4 className="text-foreground text-xs font-bold leading-tight truncate">{card.card_name}</h4>
                        <span className="text-[9px] text-muted-foreground font-medium">{card.bank}</span>
                      </div>
                      <Badge variant="info" className="text-[8px] uppercase tracking-wider px-2 ml-auto flex-shrink-0">{card.best_for}</Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed italic">"{card.why_for_this_trip}"</p>
                    <div className="border-t border-border/40 pt-2.5 space-y-1.5 text-[10px]">
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Forex Markup Fee:</span>
                        <span className="font-extrabold text-foreground text-xs">{card.forex_fee}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-muted-foreground flex-shrink-0">Key Benefit:</span>
                        <span className="font-semibold text-foreground text-right max-w-[220px] truncate" title={card.key_benefit}>{card.key_benefit}</span>
                      </div>
                    </div>
                    <Button className="w-full" size="sm" asChild>
                      <a href={card.apply_url} target="_blank" rel="noopener noreferrer">Apply Now</a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: Booking Platforms */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          🌐 Recommended Booking Platforms
        </h3>
        <div className="space-y-2">
          {(hasFlights || noItems) && (
            <Card>
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Flights</span>
                  <span className="text-[9px] text-muted-foreground">Skyscanner · G-Flights</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'Skyscanner', promo: 'Compare free' },
                    { name: 'MakeMyTrip', promo: 'Up to ₹2000 off' },
                    { name: 'Google Flights', promo: 'Real-time alerts' },
                  ].map(p => (
                    <div key={p.name} className="bg-muted/40 border border-border/30 rounded-lg p-2 text-center text-[10px] flex flex-col justify-between min-h-[60px]">
                      <div className="font-bold text-foreground truncate">{p.name}</div>
                      <Badge variant="success" className="text-[8px] mt-1 w-full justify-center">{p.promo}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {(hasHotels || noItems) && (
            <Card>
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Hotels</span>
                  <span className="text-[9px] text-muted-foreground">Booking.com · Agoda</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Booking.com', desc: 'Best overall inventory', promo: 'Genius Discount', badge: null },
                    { name: 'Agoda', desc: 'Best deals in Asia', promo: 'Agoda Special Rate', badge: ['Southeast Asia', 'East Asia', 'Asia Nearby'].includes(destination.region) ? 'Top pick' : null },
                  ].map(p => (
                    <div key={p.name} className="bg-muted/40 border border-border/30 rounded-lg p-2 text-[10px] relative flex flex-col justify-between min-h-[70px]">
                      {p.badge && <Badge variant="success" className="absolute -top-2 -right-1 text-[7px]">{p.badge}</Badge>}
                      <div>
                        <div className="font-bold text-foreground">{p.name}</div>
                        <div className="text-[9px] text-muted-foreground mt-0.5 leading-snug">{p.desc}</div>
                      </div>
                      <Badge variant="success" className="text-[8px] mt-1 w-fit">{p.promo}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {(hasAttractions || noItems) && (
            <Card>
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Attractions</span>
                  <span className="text-[9px] text-muted-foreground">Klook · GetYourGuide</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'Klook', promo: 'FIRSTKLOOK' },
                    { name: 'GetYourGuide', promo: 'Free cancel' },
                    { name: 'Headout', promo: 'Up to 10% off' },
                  ].map(p => (
                    <div key={p.name} className="bg-muted/40 border border-border/30 rounded-lg p-2 text-center text-[10px] flex flex-col justify-between min-h-[60px]">
                      <div className="font-bold text-foreground truncate">{p.name}</div>
                      <Badge variant="success" className="text-[8px] mt-1 w-full justify-center">{p.promo}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {(hasRestaurants || noItems) && (
            <Card>
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Dining</span>
                  <span className="text-[9px] text-muted-foreground">TheFork · Maps</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'TheFork', desc: 'European reservations', promo: 'Up to 50% off', highlight: destination.region === 'Europe' },
                    { name: 'Google Maps', desc: 'Search local bookings', promo: 'Direct reservation', highlight: destination.region !== 'Europe' },
                  ].map(p => (
                    <div key={p.name} className={`border p-2 rounded-lg text-[10px] flex flex-col justify-between min-h-[70px] ${p.highlight ? 'bg-primary/5 border-primary/25' : 'bg-muted/40 border-border/30'}`}>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-1">
                          {p.name}
                          {p.highlight && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-0.5 leading-snug">{p.desc}</div>
                      </div>
                      <Badge variant="success" className="text-[8px] mt-1 w-fit">{p.promo}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
