'use client';

import { FlightOffer } from '@/types';
import FlightCard from './FlightCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { AlertCircle, PlaneTakeoff } from 'lucide-react';

interface Props {
  flights: FlightOffer[];
  isLoading: boolean;
  error: string | null;
  origin: string;
  destination: string;
}

function SkeletonCard() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="flex-1 h-3" />
            <Skeleton className="h-7 w-12" />
          </div>
        </div>
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="h-[1px] w-full mt-3 mb-2" />
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-32" />
      </div>
    </Card>
  );
}

export default function FlightResults({ flights, isLoading, error, origin, destination }: Props) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center px-4 gap-3">
        <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-destructive text-sm font-medium">Unable to load flights</p>
        <p className="text-muted-foreground text-xs">{error}</p>
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
      <div className="flex flex-col items-center justify-center h-40 text-center px-4 gap-3">
        <div className="w-10 h-10 rounded-full bg-muted/60 border border-border/40 flex items-center justify-center">
          <PlaneTakeoff className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">No flights found</p>
        <p className="text-muted-foreground/70 text-xs">{origin} → {destination}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs pb-1">
        {flights.length} flight{flights.length !== 1 ? 's' : ''} found · sorted by price
      </p>
      {flights.map((offer, i) => (
        <FlightCard key={offer.id} offer={offer} index={i} />
      ))}
    </div>
  );
}
