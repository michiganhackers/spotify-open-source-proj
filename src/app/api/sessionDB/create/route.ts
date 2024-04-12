/* API endpoint for creating a session */
import { redirect } from 'next/navigation'
import { CreateSession, CreateUser } from "@/src/database/db";

export async function POST(req: Request) {
    const data = await req.json();
    const accessToken : string = data.accessToken;
    const refreshToken : string = data.refreshToken;
    
    const host = await CreateUser(data.username);
    const sid = await CreateSession(host.user_id, accessToken, refreshToken);
    
    // Send the session id to sessionStorage, where it will live for the duration of the tab's existence
    sessionStorage.setItem("sid", sid);
    sessionStorage.setItem("username", host.user_name)
    sessionStorage.setItem("isHost", "true");
    
    // If passes all checks, redirect to session page
    redirect('/session');
}