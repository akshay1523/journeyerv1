export interface LatLng {
  lat: number;
  lng: number;
}

export type Region = 'Asia' | 'Europe' | 'Americas' | 'Oceania' | 'MiddleEast' | 'Africa';

export interface TouristSpot {
  name: string;
  coords: LatLng;
  description?: string;
}

export interface Destination {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  iataCode: string;
  coords: LatLng;
  region: Region;
  touristSpots: TouristSpot[];
  gygSearchQuery: string;
}

export interface DateRange {
  departure: Date;
  returnDate: Date;
}

export interface FlightSegment {
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
  carrierCode: string;
  number: string;
  duration: string;
}

export interface FlightItinerary {
  duration: string;
  segments: FlightSegment[];
}

export interface FlightPrice {
  total: string;
  currency: string;
}

export interface FlightOffer {
  id: string;
  itineraries: FlightItinerary[];
  price: FlightPrice;
  numberOfBookableSeats: number;
  lastTicketingDate?: string;
  validatingAirlineCodes?: string[];
}

export interface RecentSearch {
  destination: Destination;
  dates:       DateRange;
  originIata:  string;
}

export type AppPhase = 'onboarding' | 'globe' | 'calendar' | 'detail';

export interface AppState {
  phase: AppPhase;
  originIata: string | null;
  originCoords: LatLng | null;
  selectedDestination: Destination | null;
  dateRange: DateRange | null;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departure: string;
  returnDate: string;
}
