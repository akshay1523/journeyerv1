import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

function extractVideoId(url: string): string | null {
  if (!url) return null;
  if (url.includes('/shorts/')) {
    const parts = url.split('/shorts/');
    if (parts[1]) {
      return parts[1].split(/[?#&]/)[0].trim();
    }
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  if (url.length === 11) {
    return url;
  }
  return null;
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
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'Missing YouTube URL' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // 1. Fetch metadata using YouTube oEmbed
    let title = 'YouTube Travel Video';
    let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const oEmbedRes = await fetch(oEmbedUrl);
      if (oEmbedRes.ok) {
        const metadata = await oEmbedRes.json();
        title = metadata.title || title;
        thumbnailUrl = metadata.thumbnail_url || thumbnailUrl;
      }
    } catch (err) {
      console.warn('oEmbed fetch failed, using fallbacks:', err);
    }

    // 2. Fetch transcript with fallback
    let transcriptText = '';
    try {
      const transcriptRes = await fetch(`https://www.youtube-transcript-api.com/api/transcript?video_id=${videoId}`);
      if (!transcriptRes.ok) {
        throw new Error('Primary transcript API failed');
      }
      const data = await transcriptRes.json();
      if (Array.isArray(data)) {
        transcriptText = data.map(t => t.text).join(' ');
      } else {
        transcriptText = JSON.stringify(data);
      }
    } catch (err) {
      console.warn('Primary transcript API failed, trying fallback...', err);
      try {
        const fallbackRes = await fetch(`https://youtube-transcript.ai/transcript/${videoId}.txt`);
        if (!fallbackRes.ok) {
          throw new Error('Fallback transcript API failed');
        }
        const rawText = await fallbackRes.text();
        // Remove timestamps e.g. [0:01]
        transcriptText = rawText.replace(/\[\d+:\d+(?::\d+)?\]/g, '').replace(/\s+/g, ' ').trim();
      } catch (fallbackErr) {
        console.error('All transcript APIs failed', fallbackErr);
        return NextResponse.json({ error: 'Could not retrieve transcript from this video. Ensure it has captions enabled.' }, { status: 500 });
      }
    }

    if (!transcriptText || transcriptText.length < 50) {
      return NextResponse.json({ error: 'Video transcript is empty or too short.' }, { status: 400 });
    }

    // 3. Call Gemini to extract recommendations
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Extract all travel destinations, places, attractions, restaurants and hotels mentioned in this transcript. 
Return ONLY a JSON array like:
[
  {
    "name": "place name",
    "type": "attraction", // must be either: attraction, restaurant, or hotel
    "country": "country name",
    "description": "one line from transcript describing this place"
  }
]
Only include real, specific named places. Ignore vague references.

Transcript:
${transcriptText.substring(0, 15000)}`; // limit transcript length to stay within model input limits safely

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanJson = response.text().trim();

    let places = [];
    try {
      places = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Gemini output could not be parsed as JSON:', cleanJson, parseErr);
      return NextResponse.json({ error: 'Failed to parse extracted places from Gemini.' }, { status: 500 });
    }

    return NextResponse.json({
      videoId,
      title,
      thumbnailUrl,
      places: Array.isArray(places) ? places : []
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[parse-youtube API error]:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
