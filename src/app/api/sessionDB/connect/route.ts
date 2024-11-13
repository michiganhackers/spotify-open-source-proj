/* API endpoint for connecting to a session */
import { CreateUser, VerifyGuestCode } from '../../../../database/db'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server';
import 'dotenv/config'

export async function POST(req: Request) {
    
    const data = await req.json();
    const guestCode : string = data.guestCode;

    const username : string = data.username;

    let sid : string;
    try {
        sid  = await VerifyGuestCode(guestCode);
    }
    catch (e) {
        return NextResponse.json(
            { message: "Guest code incorrect" },
            { status: 401 }
        )
    }

    try {
        await CreateUser(username, sid, false);
    }
    catch (e) {
        return NextResponse.json(
            { message: "could not create user - username already in use"},
            { status: 500 }
        )
    }
    
    // If passes all checks, redirect to session page
    // redirect('/session/' + sid)
    return NextResponse.json(
        { url: `session/${sid}` },
        { status: 200 }
    );
}