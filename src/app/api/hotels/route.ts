import { NextRequest, NextResponse } from 'next/server';

interface SerpHotel {
  name: string;
  overall_rating?: number;
  reviews?: number;
  rate_per_night?: { lowest: string };
  images?: { thumbnail: string }[];
  link?: string;
  amenities?: string[];
}

interface SerpResponse {
  properties?: SerpHotel[];
  error?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');
  const country = searchParams.get('country');

  if (!city || !country) {
    return NextResponse.json({ error: 'Missing city or country' }, { status: 400 });
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'SERPAPI_KEY not set' }, { status: 500 });
  }

  const url = new URL('https://serpapi.com/search');
  url.searchParams.set('engine', 'google_hotels');
  url.searchParams.set('q', `hotels in ${city} ${country}`);
  url.searchParams.set('check_in_date', new Date().toISOString().split('T')[0]);
  url.searchParams.set('check_out_date', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  url.searchParams.set('currency', 'USD');
  url.searchParams.set('hl', 'en');
  url.searchParams.set('api_key', apiKey);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);

    const data: SerpResponse = await res.json();
    if (data.error) throw new Error(data.error);

    // Map SerpAPI field names to what useHotels hook expects
    const hotels = (data.properties ?? []).slice(0, 5).map((h) => ({
      name:      h.name,
      rating:    h.overall_rating,
      reviews:   h.reviews,
      price:     h.rate_per_night?.lowest,
      thumbnail: h.images?.[0]?.thumbnail,
      link:      h.link ?? null,
      amenities: h.amenities,
    }));

    return NextResponse.json({ data: hotels });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[hotels API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}