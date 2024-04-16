import { GetSessionData } from '@/src/database/db';
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const body = await req.json();
    const sid = body.sid;

    var sessionData : any = await GetSessionData(sid);

    return NextResponse.json(
        sessionData,
        { status : 201 }
    )
}