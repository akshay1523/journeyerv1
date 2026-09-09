import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[recommend-cards API warning]: GEMINI_API_KEY is missing. Using fallback cards.');
    let reqCountry = 'Thailand';
    try {
      const body = await req.clone().json();
      if (body?.country) reqCountry = body.country;
    } catch {}
    return NextResponse.json({ data: getFallbackCards(reqCountry) });
  }

  try {
    const { country, days, amount, count, month } = await req.json();

    if (!country || !days || !amount) {
      return NextResponse.json({ error: 'Missing required parameters: country, days, and amount.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const systemPrompt = `You are an Indian travel finance expert. Given trip details, recommend the top 3 Indian travel credit cards. Return ONLY a JSON array of objects with the exact structure:
[
  {
    "card_name": "Name of Card",
    "bank": "Name of Bank",
    "best_for": "one short tag like Lounge Access, Rewards, or Zero Forex",
    "why_for_this_trip": "one sentence specific to their destination and duration",
    "forex_fee": "0% or 1.99% etc",
    "key_benefit": "one killer benefit",
    "apply_url": "actual bank application URL"
  }
]
Only recommend real Indian cards. Be specific to the trip context.`;

    const userMessage = `Recommend cards for: Destination: ${country}, Duration: ${days} days, Estimated cost: ₹${amount}, Travellers: ${count || 2}, Travel month: ${month || 'Dec'}`;

    const prompt = `${systemPrompt}\n\nUser request: ${userMessage}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanJson = response.text().trim();

    let cards = [];
    try {
      cards = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse Gemini card recommendations JSON:', cleanJson, parseErr);
      return NextResponse.json({ data: getFallbackCards(country) });
    }

    return NextResponse.json({ data: cards });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[recommend-cards API error - using fallbacks]:', msg);
    
    // Parse country from request if possible
    let reqCountry = 'Thailand';
    try {
      const body = await req.clone().json();
      if (body?.country) reqCountry = body.country;
    } catch {}

    return NextResponse.json({ data: getFallbackCards(reqCountry) });
  }
}

function getFallbackCards(country: string) {
  return [
    {
      card_name: 'Niyo Global Card',
      bank: 'Niyo / SBM',
      best_for: 'Zero Forex Markup',
      why_for_this_trip: `Zero forex markup fee makes this perfect for spending in ${country || 'this country'}.`,
      forex_fee: '0%',
      key_benefit: 'Zero forex markup on all international spends and easy ATMs.',
      apply_url: 'https://www.goniyo.com/'
    },
    {
      card_name: 'HDFC Regalia Gold',
      bank: 'HDFC',
      best_for: 'Lounge Access',
      why_for_this_trip: 'Complimentary international airport lounge access and comprehensive travel insurance.',
      forex_fee: '2.0%',
      key_benefit: 'Complimentary Priority Pass membership and high reward points rate on travel.',
      apply_url: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-gold-credit-card'
    },
    {
      card_name: 'Axis Bank Atlas',
      bank: 'Axis',
      best_for: 'Travel Miles',
      why_for_this_trip: 'Earn 5x EDGE Miles on all travel bookings, convertible to partners.',
      forex_fee: '3.5%',
      key_benefit: '5x miles on airline/hotel bookings and airport lounge entries.',
      apply_url: 'https://www.axisbank.com/retail/cards/credit-card/axis-bank-atlas-credit-card'
    }
  ];
}
