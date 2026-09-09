import { FlightOffer } from '@/types';

// SerpAPI raw types
interface SerpLeg {
  departure_airport: { id: string; time: string };
  arrival_airport:   { id: string; time: string };
  duration:          number;
  flight_number:     string;
  airline:           string;
}

interface SerpResult {
  flights:         SerpLeg[];
  total_duration:  number;
  price:           number;
  airline_logo?:   string;
}

interface SerpResponse {
  best_flights?:  SerpResult[];
  other_flights?: SerpResult[];
  error?:         string;
}

function toIso(serpTime: string): string {
  return serpTime.replace(' ', 'T') + ':00';
}

function carrierCode(flightNumber: string): string {
  return flightNumber.match(/^([A-Z]{2})/)?.[1] ?? flightNumber.slice(0, 2);
}

function minutesToDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h}H${m}M`;
}

function mapToFlightOffer(result: SerpResult, index: number): FlightOffer {
  const segments = result.flights.map(leg => ({
    departure: { iataCode: leg.departure_airport.id, at: toIso(leg.departure_airport.time) },
    arrival:   { iataCode: leg.arrival_airport.id,   at: toIso(leg.arrival_airport.time)   },
    carrierCode: carrierCode(leg.flight_number),
    number:      leg.flight_number,
    duration:    minutesToDuration(leg.duration),
  }));

  return {
    id: String(index),
    price: { total: String(result.price), currency: 'USD' },
    validatingAirlineCodes: [segments[0]?.carrierCode ?? ''],
    numberOfBookableSeats: 9,
    itineraries: [
      { duration: minutesToDuration(result.total_duration), segments },
    ],
  };
}

export async function searchFlightOffers(params: {
  origin:        string;
  destination:   string;
  departureDate: string;
}): Promise<FlightOffer[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error('SERPAPI_KEY is not set in environment variables');

  const url = new URL('https://serpapi.com/search');
  url.searchParams.set('engine',        'google_flights');
  url.searchParams.set('departure_id',  params.origin);
  url.searchParams.set('arrival_id',    params.destination);
  url.searchParams.set('outbound_date', params.departureDate);
  url.searchParams.set('type',          '2');
  url.searchParams.set('currency',      'USD');
  url.searchParams.set('hl',            'en');
  url.searchParams.set('api_key',       apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);

  const data: SerpResponse = await res.json();
  if (data.error) throw new Error(`SerpAPI: ${data.error}`);

  const all = [
    ...(data.best_flights  ?? []),
    ...(data.other_flights ?? []),
  ];

  return all
    .filter(r => r.flights.length <= 3)
    .map((r, i) => mapToFlightOffer(r, i))
    .sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));
}