/* API endpoint for connecting to a session */
import { redirect } from 'next/navigation'
import { VerifyGuestCode } from '../../../../database/db'

export async function POST(req: Request) {
    const data = await req.json();
    const guestCode : string = data.guestCode;
    
    const sid = await VerifyGuestCode(guestCode);

    // Send the session id to sessionStorage, where it will live for the duration of the tab's existence
    sessionStorage.setItem("sid", sid);
    sessionStorage.setItem("isHost", "false");
    
    // If passes all checks, redirect to session page
    redirect('/session');
}