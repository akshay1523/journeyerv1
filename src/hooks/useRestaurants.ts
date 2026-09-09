import useSWR from 'swr';

export interface Restaurant {
  title:            string;
  rating?:          number;
  reviews?:         number;
  type?:            string;
  description?:     string;
  thumbnail?:       string;
  website?:         string;
  price?:           string;
  data_cid?:        string;
  gps_coordinates?: { latitude: number; longitude: number };
}

const fetcher = (url: string) =>
  fetch(url).then(r => r.json()).then(j => {
    if (j.error) throw new Error(j.error);
    return j.data as Restaurant[];
  });

export function useRestaurants(city: string, country: string, enabled: boolean) {
  const key = enabled
    ? `/api/restaurants?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`
    : null;

  const { data, isLoading, error } = useSWR<Restaurant[]>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { restaurants: data ?? [], isLoading, error: error?.message ?? null };
}
