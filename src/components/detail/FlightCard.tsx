'use client';

import { FlightOffer } from '@/types';
import { parseISO, format } from 'date-fns';
import { useItinerary } from '@/context/ItineraryContext';

interface Props {
  offer: FlightOffer;
  index: number;
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : '';
  const m = match[2] ? ` ${match[2]}m` : '';
  return `${h}${m}`.trim();
}

function stopLabel(segments: number): { text: string; color: string } {
  const stops = segments - 1;
  if (stops === 0) return { text: 'Nonstop', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
  if (stops === 1) return { text: '1 Stop', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' };
  return { text: '2 Stops', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
}

function buildGoogleFlightsUrl(offer: FlightOffer): string {
  const out = offer.itineraries[0];
  const ret = offer.itineraries[1];
  const orig = out.segments[0].departure.iataCode;
  const dest = out.segments[out.segments.length - 1].arrival.iataCode;
  const dep = format(parseISO(out.segments[0].departure.at), 'yyyy-MM-dd');
  const base = `https://www.google.com/travel/flights#flt=${orig}.${dest}.${dep}`;
  if (ret) {
    const retDate = format(parseISO(ret.segments[0].departure.at), 'yyyy-MM-dd');
    return `${base}*${dest}.${orig}.${retDate};c:INR;e:1;sd:1;t:f`;
  }
  return `${base};c:INR;e:1;sd:1;t:f`;
}

const AIRLINES: Record<string, string> = {
  AA: 'American Airlines', UA: 'United Airlines', DL: 'Delta Air Lines',
  BA: 'British Airways', LH: 'Lufthansa', AF: 'Air France',
  EK: 'Emirates', QR: 'Qatar Airways', SQ: 'Singapore Airlines',
  NH: 'ANA', JL: 'Japan Airlines', CX: 'Cathay Pacific',
  KE: 'Korean Air', OZ: 'Asiana Airlines', TK: 'Turkish Airlines',
  IB: 'Iberia', AZ: 'ITA Airways', SK: 'SAS', KL: 'KLM',
  LX: 'Swiss Air', OS: 'Austrian Airlines', AC: 'Air Canada',
  QF: 'Qantas', NZ: 'Air New Zealand', VS: 'Virgin Atlantic',
  WN: 'Southwest', B6: 'JetBlue', AS: 'Alaska Airlines',
  F9: 'Frontier', NK: 'Spirit', G4: 'Allegiant',
};

export default function FlightCard({ offer, index }: Props) {
  const outbound = offer.itineraries[0];
  if (!outbound) return null;

  const firstSeg = outbound.segments[0];
  const lastSeg = outbound.segments[outbound.segments.length - 1];
  const stopInfo = stopLabel(outbound.segments.length);
  const airlineCode = offer.validatingAirlineCodes?.[0] ?? firstSeg.carrierCode;
  const airlineName = AIRLINES[airlineCode] ?? airlineCode;
  const depTime = format(parseISO(firstSeg.departure.at), 'HH:mm');
  const arrTime = format(parseISO(lastSeg.arrival.at), 'HH:mm');

  const { addItem, removeItem, isAdded, setIsOpen } = useItinerary();
  const itemId = `flight-${offer.id}`;
  const added = isAdded(itemId);

  const handleAdd = () => {
    if (added) {
      removeItem(itemId);
    } else {
      addItem({
        id: itemId,
        type: 'flight',
        title: `${firstSeg.departure.iataCode} → ${lastSeg.arrival.iataCode}`,
        subtitle: format(parseISO(firstSeg.departure.at), 'MMM d, HH:mm'),
        price: `₹${(parseFloat(offer.price.total) * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      });
      setIsOpen(true);
    }
  };

  return (
    <div className="bg-card-bg hover:bg-secondary-bg/30 border border-border-color rounded-xl p-4 transition-all cursor-default group shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] font-bold text-secondary-text bg-secondary-bg border border-border-color/50 rounded px-1.5 py-0.5">
              {airlineCode}
            </span>
            <span className="text-xs text-secondary-text truncate">{airlineName}</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${stopInfo.color} ml-auto font-semibold`}>
              {stopInfo.text}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-primary-text text-lg font-semibold leading-tight">{depTime}</div>
              <div className="text-secondary-text text-xs">{firstSeg.departure.iataCode}</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="text-secondary-text/80 text-xs">{parseDuration(outbound.duration)}</div>
              <div className="w-full flex items-center gap-1">
                <div className="flex-1 border-t border-border-color/50" />
                {outbound.segments.length > 1 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary-text" />
                )}
                <svg className="w-3 h-3 text-secondary-text/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              </div>
              {outbound.segments.length > 1 && (
                <div className="text-secondary-text/60 text-[10px]">
                  via {outbound.segments.slice(0, -1).map(s => s.arrival.iataCode).join(', ')}
                </div>
              )}
            </div>
            <div>
              <div className="text-primary-text text-lg font-semibold leading-tight">{arrTime}</div>
              <div className="text-secondary-text text-xs">{lastSeg.arrival.iataCode}</div>
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-primary-text text-xl font-black">
            ₹{(parseFloat(offer.price.total) * 83).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-secondary-text text-xs">INR / person</div>
          {offer.numberOfBookableSeats <= 5 && (
            <div className="text-orange-500 text-xs mt-1 font-semibold">
              {offer.numberOfBookableSeats} seat{offer.numberOfBookableSeats !== 1 ? 's' : ''} left
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-border-color/30 flex items-center justify-between">
        {index === 0 ? (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500 text-xs font-semibold">Best price</span>
          </div>
        ) : <span />}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
              added
                ? 'bg-green-500/10 border-green-500/20 text-green-500 font-bold'
                : 'bg-card-bg border-border-color text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
            }`}
          >
            {added ? '✓ Added' : '+ Add'}
          </button>
          <a
            href={buildGoogleFlightsUrl(offer)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 transition-colors"
          >
            Open in Google Flights
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}