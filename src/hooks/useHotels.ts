import useSWR from 'swr';

export interface Hotel {
  name: string;
  rating?: number;
  reviews?: number;
  price?: string;
  thumbnail?: string;
  link?: string;
  amenities?: string[];
}

const fetcher = (url: string) =>
  fetch(url).then(r => r.json()).then(j => {
    if (j.error) throw new Error(j.error);
    return j.data as Hotel[];
  });

export function useHotels(city: string, country: string) {
  const key = `/api/hotels?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
  const { data, isLoading, error } = useSWR<Hotel[]>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { hotels: data ?? [], isLoading, error: error?.message ?? null };
}