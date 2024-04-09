import postgres from 'postgres'
import 'dotenv/config'
import { RSC_ACTION_CLIENT_WRAPPER_ALIAS } from 'next/dist/lib/constants'

const sql = postgres(process.env.POSTGRES_URI!) // will use psql environment variables

export async function CreateUser(
    username : string,
    sessionID? : string) : Promise<any> {
    
    // Insert new user into DB
    const user = {
        "session_id": sessionID ? sessionID : "NULL",
        "username": username
    }

    const users : any[] = await sql`
        SELECT * FROM users
        WHERE username = ${username}
    `

    if (users.length > 0) {
        for (let i = 0; i < users.length; i++) {
            let session = users[i]['session_id']
            if (session === sessionID || session === "NULL") {
                throw new Error("User in this session already exists.")
            }
        }
    }

    await sql`
    INSERT INTO users
    VALUES (${sql(user)})
    `

    // Get the user ID of the newly created user
    const userID = await sql`
        SELECT user_id FROM users
        WHERE username = ${user['username']}
        AND session_id = ${user['session_id']}
    `

    // Return the user ID of newly created user
    return userID[0]['user_id'];
}

export async function VerifyGuestCode(guestCode : string) : Promise<any> {
    const sid : any[] = await sql`
        SELECT session_id FROM sessions
        WHERE session_id = ${guestCode}
    `

    if(sid.length < 1) { // ERROR: No guest code that matches
        throw new Error("Wrong guest code");
    }

    return sid[0]; // Return the session id
}

export async function CreateSession(
    hostID : number,
    accessToken : string,
    refreshToken : string) : Promise<any> {

    // Get all currently used session codes
    const codes : any[] = await sql`
        SELECT session_id FROM sessions
    `
    
    // TODO: Consider hashing or encrypting the created code to improve security
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

    // Update host's user entry with session ID
    await sql`
    UPDATE users
    SET session_id = ${code}
    WHERE user_id = ${hostID}
    `

    return code;
}

// RETURNS: list of users in the session including hosts name
//          sorted queue of all the songs in the session and their properties
export async function GetSessionData(sid : string) : Promise<any> {

    const hostId : any[] = await sql`
        SELECT host_id FROM session
        WHERE session.session_id = ${sid}
    `

    if(hostId.length < 1) { // If no session exists
        throw new Error("Wrong guest code")
    }

    const hostName : any[] = await sql`
        SELECT username FROM users
        WHERE users.user_id = ${hostId}
    `

    const clientNames : any[] = await sql`
        SELECT username FROM users
        WHERE users.session_id = ${sid} AND users.user_id <> ${hostId}
    `

    // Returns queue in sorted order
    const queue : any[] = await sql`
        SELECT q.song_name, q.artist_name, q.album_cover, q.placement, q.added_by
        FROM queues q
        WHERE q.session_id = ${sid}
        ORDER BY song_id
    `
    
    return {hostName: hostName[0], clientNames: clientNames, queue: queue}; // Return an object containing the hosts user name
}


export async function GetAccessToken(sid : string) : Promise<any> {
    const token = await sql`
        SELECT access_token FROM sessions
        WHERE session_id = ${sid}
    `

    if(token.length < 1) {
        throw Error("Undefined session id")
    }

    return token[0];
}


export async function AddSongToQueue(
    songId : string, songName : string,
    albumCover : string, artistName : string,
    placement : string, addedBy : string, sid : string) : Promise<void> {

    const song = {
        song_id: songId,
        song_name: songName,
        album_cover: albumCover,
        artist_name: artistName,
        placement: placement,
        added_by: addedBy,
        session_id: sid
    }

    // Create new song entry in queues with given params
    await sql`
        INSERT INTO queues 
        VALUES (${sql(song)})
    `
}
    