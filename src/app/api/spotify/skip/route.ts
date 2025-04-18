import { GetAccessToken } from "@/src/database/db";
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const { sid } = await req.json();
    const access_token = await GetAccessToken(sid);
    const url = 'https://api.spotify.com/v1/me/player/next';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Length': '0'
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
        { success: true, message: 'Skipped to next track' },
        { status: 200 }
    );
}
