import { NextRequest, NextResponse } from 'next/server';

interface SerpPlace {
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

interface SerpResponse {
  local_results?: SerpPlace[];
  error?:         string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city    = searchParams.get('city');
  const country = searchParams.get('country');

  if (!city || !country) {
    return NextResponse.json({ error: 'Missing city or country' }, { status: 400 });
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'SERPAPI_KEY not set' }, { status: 500 });
  }

  const url = new URL('https://serpapi.com/search');
  url.searchParams.set('engine',  'google_maps');
  url.searchParams.set('q',       `best popular restaurants in ${city} ${country}`);
  url.searchParams.set('type',    'search');
  url.searchParams.set('hl',      'en');
  url.searchParams.set('api_key', apiKey);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);

    const data: SerpResponse = await res.json();
    if (data.error) throw new Error(data.error);

    // Sort by reviews descending (popularity)
    const places = (data.local_results ?? [])
      .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
      .slice(0, 20);
    return NextResponse.json({ data: places });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[restaurants API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
