/* API endpoint for connecting to a session */
import { redirect } from 'next/navigation'
import { connectToSession } from '../../../../database/db'

export async function POST(req: Request) {
    const data = await req.json();
    const guestCode : string = data.guestCode;

    // TODO: Create database handler that verifies unique guestCode exists in an existing session

    // TODO: Create database handler that sends user information to database to be added to session
    
    const sessionData = await connectToSession(guestCode);
    
    // If passes all checks, redirect to session page
    redirect('/session');
}