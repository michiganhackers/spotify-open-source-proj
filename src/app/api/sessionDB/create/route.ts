/* API endpoint for creating a session */
import { redirect } from 'next/navigation'
import { CreateSession } from "@/src/database/db";
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server';
import 'dotenv/config'

export async function POST(req: Request) {
    
    const data = await req.json();
    const accessToken : string = data.accessToken;
    const refreshToken : string = data.refreshToken;
    const expires_in : number = data.expires_in;

    const now : any = Date.now();
    const expiration = new Date(now + (expires_in * 1000)).toISOString(); // Time of expiration, expressed in "YYYY-MM-DDT00:00:00Z" (ISO format)
    
    let sid;
    try {
        sid = await CreateSession(accessToken, refreshToken, expiration);
    }
    catch (error) {
        return NextResponse.json(
            { message: `Error creating session in DB:\n
                    \t${error}` },
            { status: 500 }
        )
    }
    
    // return status 201
    return NextResponse.json(
        { sid: sid },
        { status: 201 }
    )
}