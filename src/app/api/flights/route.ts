import { NextRequest, NextResponse } from 'next/server';
import { searchFlightOffers } from '@/lib/serpapi';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departure = searchParams.get('departure');

  if (!origin || !destination || !departure) {
    return NextResponse.json(
      { error: 'Missing required query params: origin, destination, departure' },
      { status: 400 }
    );
  }

  try {
    const flights = await searchFlightOffers({
      origin,
      destination,
      departureDate: departure,
    });
    return NextResponse.json({ data: flights });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[flights API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}