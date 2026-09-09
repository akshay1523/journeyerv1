'use client';

import useSWR from 'swr';
import { FlightOffer, FlightSearchParams } from '@/types';

const fetcher = async (url: string): Promise<FlightOffer[]> => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to fetch flights');
  return json.data;
};

export function useAmadeusFlights(params: FlightSearchParams | null) {
  const key = params
    ? `/api/flights?origin=${params.origin}&destination=${params.destination}&departure=${params.departure}&return=${params.returnDate}`
    : null;

  const { data, error, isLoading } = useSWR<FlightOffer[]>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    flights: data ?? [],
    isLoading,
    error: error?.message ?? null,
  };
}
