import useSWR from 'swr';

export interface Activity {
  title:            string;
  rating?:          number;
  reviews?:         number;
  type?:            string;
  description?:     string;
  thumbnail?:       string;
  website?:         string;
  data_cid?:        string;
  gps_coordinates?: { latitude: number; longitude: number };
}

const fetcher = (url: string) =>
  fetch(url).then(r => r.json()).then(j => {
    if (j.error) throw new Error(j.error);
    return j.data as Activity[];
  });

export function useActivities(city: string, country: string) {
  const key = `/api/activities?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
  const { data, isLoading, error } = useSWR<Activity[]>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { activities: data ?? [], isLoading, error: error?.message ?? null };
}
