/* API endpoint for creating a session */
import { redirect } from 'next/navigation'
import { CreateSession, CreateUser } from "@/src/database/db";
import { cookies } from 'next/headers'

export async function POST(req: Request) {
    const cookieStore = cookies();

    const data = await req.json();
    const accessToken : string = data.accessToken;
    const refreshToken : string = data.refreshToken;
    const username : string = String(cookieStore.get('username'));
    
    const host = await CreateUser(username);
    const sid = await CreateSession(host.user_id, accessToken, refreshToken);
    
    // Send the session id to sessionStorage, where it will live for the duration of the tab's existence
    cookies().set('sid', sid)
    cookies().set('username', username)
    cookies().set('isHost', 'true')
    
    // If passes all checks, redirect to session page
    redirect('/session');
}