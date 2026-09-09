import { FlightOffer } from '@/types';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Amadeus API credentials not configured. Set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env.local');
  }

  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`Amadeus auth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

export async function searchFlightOffers(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults?: number;
}): Promise<FlightOffer[]> {
  const token = await getAccessToken();

  const query = new URLSearchParams({
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    adults: String(params.adults ?? 1),
    max: '50',
    currencyCode: 'USD',
  });

  const res = await fetch(
    `https://test.api.amadeus.com/v2/shopping/flight-offers?${query}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Flight search failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  const offers: FlightOffer[] = data.data ?? [];

  // Filter: max 2 stops per itinerary (i.e. max 2 segments per itinerary... wait:
  // segments = legs, so 1 segment = nonstop, 2 segments = 1 stop, 3 segments = 2 stops)
  const filtered = offers.filter((offer) =>
    offer.itineraries.every((itin) => itin.segments.length <= 3)
  );

  // Sort by price ascending
  filtered.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));

  return filtered;
}
