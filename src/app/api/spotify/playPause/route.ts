import { GetAccessToken } from "@/src/database/db";
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const { sid, state } = await req.json();
    const access_token = await GetAccessToken(sid);
    const endpoint = state ? 'play' : 'pause';
    console.log(endpoint)
    const url = `https://api.spotify.com/v1/me/player/${endpoint}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Length': '0' // Required by Spotify API
        }
    });

    if (!response.ok) {
        const error = await response.json();
        return NextResponse.json(
            { error: error.error.message },
            { status: response.status }
        );
    }

    return NextResponse.json(
        { success: true, is_playing: state },
        { status: 200 }
    );
}
