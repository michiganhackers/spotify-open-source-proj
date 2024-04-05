import postgres from 'postgres'
import 'dotenv/config'

const sql = postgres(process.env.POSTGRES_URI!) // will use psql environment variables

export async function ConnectToSession(guestCode : string) : Promise<any> {
    const session : any[] = await sql`
        SELECT session FROM sessions
        WHERE session.session_id = ${guestCode}
    `

    if(session.length < 1) { // ERROR: No guest code that matches
        throw new Error("Wrong guest code");
    }

    return session[0]; // Return the session as an object (maybe only need to return the session_id)
}

export async function CreateSession(
    hostID : number,
    accessToken : string,
    refreshToken : string) : Promise<any> {

    // Get all currently used session codes
    const codes : any[] = await sql`
        SELECT session_id FROM sessions
    `

    function CreateCode() {
        // Generates a new code
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Generate a new code until it is unique
    let code;
    let is_unique = true
    do {
        code = CreateCode();
        for (let i = 0; i < codes.length; i++) {
            if (code === codes[i]['session_id']) is_unique = false;
        }
    } while (!is_unique)

    // Insert new session into DB
    const session = {
        "session_id": code,
        "host_id": hostID,
        "access_token": accessToken,
        "refresh_token": refreshToken
    }
    await sql`
    INSERT INTO sessions
    VALUES (${sql(session)})
    `

    return code;
}