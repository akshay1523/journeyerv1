'use client';

import { FlightOffer } from '@/types';
import FlightCard from './FlightCard';

interface Props {
  flights: FlightOffer[];
  isLoading: boolean;
  error: string | null;
  origin: string;
  destination: string;
}

function SkeletonCard() {
  return (
    <div className="bg-card-bg border border-border-color rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex gap-2 mb-3">
            <div className="h-4 w-8 bg-secondary-bg rounded" />
            <div className="h-4 w-24 bg-secondary-bg rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-7 w-12 bg-secondary-bg rounded" />
            <div className="flex-1 h-3 bg-secondary-bg rounded" />
            <div className="h-7 w-12 bg-secondary-bg rounded" />
          </div>
        </div>
        <div className="h-8 w-16 bg-secondary-bg rounded" />
      </div>
    </div>
  );
}

export default function FlightResults({ flights, isLoading, error, origin, destination }: Props) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center px-4">
        <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-rose-500 text-sm font-medium">Unable to load flights</p>
        <p className="text-secondary-text text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center px-4">
        <div className="w-10 h-10 rounded-full bg-card-bg border border-border-color flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-secondary-text text-sm">No flights found</p>
        <p className="text-secondary-text/80 text-xs mt-1">{origin} → {destination}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-secondary-text text-xs pb-1">
        {flights.length} flight{flights.length !== 1 ? 's' : ''} found · sorted by price
      </p>
      {flights.map((offer, i) => (
        <FlightCard key={offer.id} offer={offer} index={i} />
      ))}
    </div>
  );
}
