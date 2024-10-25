/* 
API endpoint for adding host name to already created session
*/
import { CreateUser } from '@/src/database/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const data = await req.json();
    const hostname = data.username;
    const sid = data.sid;

    CreateUser(hostname, sid, true);

    return NextResponse.json({ status: 200 })
}