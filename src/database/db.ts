import postgres from 'postgres';
import 'dotenv/config'

const sql = postgres(process.env.POSTGRES_URI!) // will use psql environment variables

export async function connectToSession(guestCode : string) : Promise<any> {
    const session : any[] = await sql`
        SELECT session FROM sessions
        WHERE session.session_id = ${guestCode}
    `

    if(session.length < 1) { // ERROR: No guest code that matches
        throw new Error("Wrong guest code");
    }

    return session[0]; // Return the session as an object (maybe only need to return the session_id)
}