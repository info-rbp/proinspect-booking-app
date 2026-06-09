import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && origin.includes('myshopify.com') ? origin : '*';

  return {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store'
  };
}

function getMapsApiKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_PROINSPECT || process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY_PROINSPECT is not configured.');
  }

  return apiKey;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin'))
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  const input = (requestUrl.searchParams.get('input') || '').trim();

  if (input.length < 3) {
    return NextResponse.json({ suggestions: [] }, { headers: corsHeaders(origin) });
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': getMapsApiKey(),
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat'
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ['au'],
        locationBias: {
          circle: {
            center: { latitude: -31.9523, longitude: 115.8613 },
            radius: 80000
          }
        }
      })
    });

    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json(
        { error: 'Google Places autocomplete failed', message },
        { status: 502, headers: corsHeaders(origin) }
      );
    }

    const payload = await response.json();
    const suggestions = (payload.suggestions || [])
      .map((suggestion: any) => suggestion.placePrediction)
      .filter(Boolean)
      .map((prediction: any) => ({
        placeId: prediction.placeId,
        text: prediction.text?.text || '',
        mainText: prediction.structuredFormat?.mainText?.text || prediction.text?.text || '',
        secondaryText: prediction.structuredFormat?.secondaryText?.text || ''
      }))
      .filter((suggestion: any) => suggestion.placeId && suggestion.text);

    return NextResponse.json({ suggestions }, { headers: corsHeaders(origin) });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load address suggestions' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
