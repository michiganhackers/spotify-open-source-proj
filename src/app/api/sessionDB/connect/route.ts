/* API endpoint for connecting to a session */
import { redirect } from 'next/navigation'
import { CreateUser, VerifyGuestCode } from '../../../../database/db'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
    
    const data = await req.json();
    const guestCode : string = data.guestCode;

    const username : string = String(cookies().get('username'));
    
    const sid  = await VerifyGuestCode(guestCode);
    const user = await CreateUser(username, sid);

    // Send the session id to sessionStorage, where it will live for the duration of the tab's existence
    cookies().set('sid', sid)
    cookies().set('username', username)
    cookies().set('isHost', 'false')
    
    // If passes all checks, redirect to session page
    redirect('/session');
}