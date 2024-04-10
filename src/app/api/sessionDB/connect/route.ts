/* API endpoint for connecting to a session */
import { redirect } from 'next/navigation'
import { CreateUser, VerifyGuestCode } from '../../../../database/db'

export async function POST(req: Request) {
    const data = await req.json();
    const guestCode : string = data.guestCode;
    
    const sid  = await VerifyGuestCode(guestCode);
    const user = await CreateUser(data.username, sid);
    const username = user.user_name;

    // Send the session id to sessionStorage, where it will live for the duration of the tab's existence
    sessionStorage.setItem("sid", sid);
    sessionStorage.setItem("username", username)
    sessionStorage.setItem("isHost", "false");
    
    // If passes all checks, redirect to session page
    redirect('/session');
}