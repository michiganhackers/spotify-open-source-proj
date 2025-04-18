import { GetAccessToken } from "@/src/database/db";
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const sid = searchParams.get('sid');
    
    if (!sid) {
        return NextResponse.json(
            { error: 'Missing session ID' },
            { status: 400 }
        );
    }

    const access_token = await GetAccessToken(sid);
    const url = 'https://api.spotify.com/v1/me/player';

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    });

    if (!response.ok) {
        if (response.status === 204) { // No content = no active playback
            return NextResponse.json({
                is_playing: false,
                progress_ms: 0,
                duration_ms: 0
            });
        }
        const error = await response.json();
        return NextResponse.json(
            { error: error.error.message },
            { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json({
        is_playing: data.is_playing,
        progress_ms: data.progress_ms || 0,
        duration_ms: data.item?.duration_ms || 0
    });
}
