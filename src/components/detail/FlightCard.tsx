'use client';

import { FlightOffer } from '@/types';
import { parseISO, format } from 'date-fns';
import { useItinerary } from '@/context/ItineraryContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, Plus, ExternalLink } from 'lucide-react';

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
  const stops = outbound.segments.length - 1;
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

  const stopBadge = stops === 0
    ? <Badge variant="success">Nonstop</Badge>
    : stops === 1
    ? <Badge variant="warning">1 Stop</Badge>
    : <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/25 dark:text-orange-400">2 Stops</Badge>;

  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <Badge variant="secondary" className="text-[10px] font-bold px-1.5">{airlineCode}</Badge>
              <span className="text-xs text-muted-foreground truncate">{airlineName}</span>
              <span className="ml-auto">{stopBadge}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-foreground text-lg font-semibold leading-tight">{depTime}</div>
                <div className="text-muted-foreground text-xs">{firstSeg.departure.iataCode}</div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="text-muted-foreground/80 text-xs">{parseDuration(outbound.duration)}</div>
                <div className="w-full flex items-center gap-1">
                  <div className="flex-1 border-t border-border/50" />
                  {outbound.segments.length > 1 && <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />}
                  <svg className="w-3 h-3 text-muted-foreground/70" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>
                {outbound.segments.length > 1 && (
                  <div className="text-muted-foreground/60 text-[10px]">
                    via {outbound.segments.slice(0, -1).map(s => s.arrival.iataCode).join(', ')}
                  </div>
                )}
              </div>
              <div>
                <div className="text-foreground text-lg font-semibold leading-tight">{arrTime}</div>
                <div className="text-muted-foreground text-xs">{lastSeg.arrival.iataCode}</div>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-foreground text-xl font-black">
              ₹{(parseFloat(offer.price.total) * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-muted-foreground text-xs">INR / person</div>
            {offer.numberOfBookableSeats <= 5 && (
              <Badge variant="warning" className="mt-1 text-[10px]">
                {offer.numberOfBookableSeats} seat{offer.numberOfBookableSeats !== 1 ? 's' : ''} left
              </Badge>
            )}
          </div>
        </div>

        <Separator className="mt-3 mb-2" />

        <div className="flex items-center justify-between">
          {index === 0 ? (
            <Badge variant="success" className="text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
              Best price
            </Badge>
          ) : <span />}
          <div className="flex items-center gap-2">
            <Button
              variant={added ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleAdd}
              className="h-7 text-xs"
            >
              {added ? <><Check className="h-3 w-3" /> Added</> : <><Plus className="h-3 w-3" /> Add</>}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" asChild>
              <a href={buildGoogleFlightsUrl(offer)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                Google Flights <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
