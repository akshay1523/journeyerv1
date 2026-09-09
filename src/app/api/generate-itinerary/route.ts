import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Activity {
  time: string;
  title: string;
  description: string;
  type: 'flight' | 'hotel' | 'activity' | 'restaurant' | 'recommendation';
  itemId?: string;
}

interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file.' },
      { status: 500 }
    );
  }

  try {
    const { destination, departureDate, returnDate, duration, travelers, items } = await req.json();

    if (!destination || !departureDate || !returnDate || !duration || !travelers) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are a professional travel planner. Generate a highly detailed, logical day-by-day travel itinerary for a trip to ${destination}.

Trip Details:
- Start Date: ${departureDate}
- End Date: ${returnDate}
- Duration: ${duration} days
- Number of Travellers: ${travelers}
- Selected Items to integrate logically:
${JSON.stringify(items, null, 2)}

Instructions:
1. Distribute the selected items logically:
   - Flights must be scheduled on the departure and arrival days (e.g., flight to destination on Day 1, flight back on the last day).
   - Hotels must be set as check-in on Day 1 and check-out on the last day.
   - Selected attractions and restaurants should be spread logically across the days to avoid fatigue.
2. If there are empty time slots in the days, you MUST recommend additional popular attractions, cafes, or restaurants in ${destination} to fill the gaps. Clearly mark these with type: "recommendation".
3. Every activity slot must have a specific time of day (e.g. "Morning", "Afternoon", "Evening", or a specific hour like "09:00 AM").
4. For each activity slot, write a short, compelling description.
5. You MUST return ONLY a valid JSON array of days. Do NOT add any conversational explanation or text outside the JSON array.

Expected JSON output format (a raw JSON array, no extra properties outside of it):
[
  {
    "day": 1,
    "date": "${departureDate}",
    "theme": "Arrival & Initial Exploration",
    "activities": [
      {
        "time": "Morning",
        "title": "Flight to ${destination}",
        "description": "Board your flight to ${destination}.",
        "type": "flight",
        "itemId": "flight-xxxx"
      }
    ]
  }
]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanJson = response.text().trim();

    if (!cleanJson) {
      throw new Error('Gemini returned an empty response.');
    }

    let parsedItinerary: ItineraryDay[];
    try {
      parsedItinerary = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON response:', cleanJson);
      throw new Error('Gemini response was not valid JSON.');
    }

    return NextResponse.json({ data: parsedItinerary });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[generate-itinerary API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
