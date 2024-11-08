// src/app/api/sessionDB/getHostName/route.ts
import { NextResponse } from 'next/server';
import { GetHostName } from '@/src/database/db'; // Update the import path as necessary

export async function GET(req: Request) {
    const url = new URL(req.url);
    const session_id = url.searchParams.get('session_id');

    if (!session_id) {
        return NextResponse.json({ message: 'Session ID (session_id) is required' }, { status: 400 });
    }

    try {
        const hostname = await GetHostName(session_id);
        if (!hostname) {
            return NextResponse.json({ message: 'Host not found for the given session ID'}, { status: 404 });
        }
        // return hostname;
        return NextResponse.json({ hostname: hostname }, { status: 200 });
    } catch (error) {
        console.error('Error fetching host name:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
