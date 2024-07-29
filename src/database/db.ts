import postgres from 'postgres'
import 'dotenv/config'
import { RSC_ACTION_CLIENT_WRAPPER_ALIAS } from 'next/dist/lib/constants'

const sql = postgres(process.env.PG_URI!)

export async function CreateUser(
    username : string,
    sessionID : string,
    isHost: boolean) : Promise<any> {
    
    // Insert new user into DB
    const userData = {
        "session_id": sessionID,
        "username": username
    }

    const users : any[] = await sql`
        SELECT * FROM users
        WHERE username = ${username} AND session_id = ${sessionID}
    `

    if (users.length > 0) {
        for (let i = 0; i < users.length; i++) {
            let session = users[i]['session_id']
            if (session === sessionID || session === "NULL") {
                throw new Error("User in this session already exists.")
            }
        }
    }

    // Insert hosts user to database
    await sql`
    INSERT INTO users (session_id, username)
    VALUES (${userData.session_id}, ${userData.username})
    `

    // Get the user ID of the newly created user
    // BUG: When creating host user no session id present, thus query fails
    // SOLUTION: ensure session id is present when querying 
    const user : any[] = await sql`
        SELECT user_id, username FROM users
        WHERE username = ${userData['username']}
        AND session_id = ${userData['session_id']}
    `

    // Update the host_id of the session with newly created host user
    if(isHost) {
        await sql`
            UPDATE sessions
            SET host_id = ${user[0].user_id}
            WHERE session_id = ${sessionID}
        `
    }

    // Return the user ID of newly created user
    return user[0]['user_id'], user[0]['user_name'];
}

export async function VerifyGuestCode(guestCode : string) : Promise<any> {
    const sid : any[] = await sql`
        SELECT session_id FROM sessions
        WHERE session_id = ${guestCode}
    `

    if(sid.length < 1) { // ERROR: No guest code that matches
        throw new Error("Wrong guest code");
    }

    return sid[0].session_id; // Return the session id
}

export async function CreateSession(
    accessToken : string,
    refreshToken : string) : Promise<any> {

    // Get all currently used session codes
    const codes : any[] = await sql`
        SELECT session_id FROM sessions
    `
    
    // TODO: Consider hashing or encrypting the created code to improve security
    function CreateCode() {
        // Generates a new code
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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
        "access_token": accessToken,
        "refresh_token": refreshToken
    }

    await sql`
    INSERT INTO sessions (session_id, access_token, refresh_token)
    VALUES (${code}, ${accessToken}, ${refreshToken})
    `
    return code;
}

// RETURNS: list of users in the session including hosts name
//          sorted queue of all the songs in the session and their properties
export async function GetSessionData(sid : string) : Promise<any> {

    const hostId : any[] = await sql`
        SELECT host_id FROM sessions
        WHERE session_id = ${sid}
    `

    if(hostId.length < 1) { // If no session exists
        throw new Error("Wrong guest code")
    }

    const hostName : any[] = await sql`
        SELECT username FROM users
        WHERE user_id = ${hostId[0].host_id}
    `

    const clientNames : any[] = await sql`
        SELECT username FROM users
        WHERE session_id = ${sid} AND user_id <> ${hostId[0].host_id}
    `

    // Returns queue in sorted order
    const queue : any[] = await sql`
        SELECT song_name, artist_name, album_cover, placement
        FROM queues
        WHERE session_id = ${sid}
        ORDER BY placement
    `
    
    return {hostName: hostName[0].username, clientNames: clientNames, queue: queue}; // Return an object containing the hosts user name
}


export async function GetAccessToken(sid : string) : Promise<any> {
    const token = await sql`
        SELECT access_token FROM sessions
        WHERE session_id = ${sid}
    `

    if(token.length < 1) {
        throw Error("Undefined session id")
    }

    return token[0].access_token;
}


export async function AddSongToQueue(
    songId : string, songName : string,
    albumCover : string, artistName : string,
    placement : number, sid : string) : Promise<void> {

    const song = {
        song_id: songId,
        song_name: songName,
        album_cover: albumCover,
        artist_name: artistName,
        placement: placement,
    }

    // Create new song entry in queues with given params
    await sql`
        INSERT INTO queues (song_id, song_name, album_cover, artist_name, placement, session_id)
        VALUES (${song.song_id}, ${song.song_name}, ${song.album_cover}, 
            ${song.artist_name}, ${song.placement}, ${sid})
    `
}

export async function GetQueue(sid : string) : Promise<any[]> {
    const queue = await sql`
        SELECT song_id from queues
        WHERE session_id = ${sid}
        ORDER BY placement
    `
    return queue;
}


export async function ReplaceQueue(sid : string, queue : any[]) : Promise<void> {

    // Drop all songs in queue of session with sid
    await sql`
        DELETE FROM queues
        WHERE session_id = ${sid}
    `
    queue.forEach(async (song : any, index : number) => {
        AddSongToQueue(
            song.songId, song.songName,
            song.albumCover, song.artistName,
            song.placement, sid)
    });
}


/*
export async function GetUserName(sid : string) : Promise<any> {
    const username = await sql`
        SELECT user_name FROM users
        WHERE 
    `
} */
    