/* 
API endpoint for adding host name to already created session
*/
import { CreateUser } from '@/src/database/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const data = await req.json();
    const hostname = data.username;
    const sid = data.sid;

    try {
        CreateUser(hostname, sid, true);
    }
    catch(err : any) {return NextResponse.json(
        { message: "Host already exists" },
        { status: 409 }
    )}
    

    return NextResponse.json({ status: 200 })
}