import { NextRequest, NextResponse } from 'next/server';

// Handle GET request for postcode lookup
export async function GET(req: NextRequest) {
    // Extract postcode from query parameters
    const postcode = req.nextUrl.searchParams.get('postcode');

    // Return 400 if postcode is missing
    if (!postcode) {
        return NextResponse.json({ error: 'Postcode required' }, { status: 400 });
    }

    // Get API key from environment variables
    const apiKey = process.env.IDEALPOSTCODES_API_KEY;

    // Return 500 if API key is not configured
    if (!apiKey) {
        return NextResponse.json({ error: 'Address lookup not configured' }, { status: 500 });
    }

    // Call IdealPostcodes API with encoded postcode
    const res = await fetch(
        `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(postcode)}?api_key=${apiKey}`
    );

    // Parse JSON response  
    const data = await res.json();

    // Log error details if API response is not successful
    if (!res.ok) {
        console.error(`IdealPostcodes postcode lookup error ${res.status}:`, data);
    }

    // Return API response with original status code
    return NextResponse.json(data, { status: res.status });
}
