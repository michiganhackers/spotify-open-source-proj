import postgres from 'postgres'
import 'dotenv/config'


// const sql = postgres(process.env.PG_URI!)
const sql = postgres({
    host                 : process.env.PG_HOST,            // Postgres ip address[s] or domain name[s]
    port                 : 5432,                            // Postgres server port[s]
    username             : process.env.PG_USER,            // Username of database user
    password             : process.env.PG_PASSWORD          // Password of database user
  })


/*
    <returns>User ID of created user</returns>
    <modifies>{users, sessions} tables</modifies>
*/
export async function CreateUser(
    username : string,
    sid : string,
    isHost: boolean) : Promise<any> {

    const users : any[] = await sql`
        SELECT * FROM users
        WHERE username = ${username} AND session_id = ${sid}
    `

    for (let i = 0; i < users.length; i++) {
        let session = users[i]['session_id']
        if (session === sid || session === "NULL") {
            throw new Error("User in this session already exists.")
        } else if(session === ''){
            throw new Error("User is blank.")
        }
    }

    // Insert hosts user to database
    await sql`
    INSERT INTO users (session_id, username)
    VALUES (${sid}, ${username})
    `

    // Get the user ID of the newly created user
    // BUG: When creating host user no session id present, thus query fails
    // SOLUTION: ensure session id is present when querying 
    const user : any[] = await sql`
        SELECT user_id, username FROM users
        WHERE username = ${username}
        AND session_id = ${sid}
    `
    const uid : any = user[0]['user_id'];

    // Update the host_id of the session with newly created host user
    if(isHost) {
        await sql`
            UPDATE sessions
            SET host_id = ${uid}
            WHERE session_id = ${sid}
        `
    }

    // Return the user ID of newly created user
    return uid;
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
    
    // SECURITY: Consider hashing or encrypting the created code to improve security
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

    if(hostId[0].host_id === null){ //here because the queue mount runs before the host is set
        throw new Error("null host_id")
    }

    const hostName : any[] = await sql`
        SELECT username FROM users
        WHERE user_id = ${hostId[0].host_id}
    `

    const clientNames : any[] = await sql`
        SELECT username FROM users
        WHERE session_id = ${sid} AND user_id <> ${hostId[0].host_id}
    `

    //Returns queue in sorted order
    const queue : any[] = await sql`
        SELECT song_id, song_name, artist_name, album_cover, placement
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
        ORDER BY placement ASC
    `
    return queue;
}


export async function ReplaceQueue(sid : string, queue : any[]) : Promise<void> {

    console.log("Replacing queue in database...");
    // Drop all songs in queue of session with sid
    await sql`
        DELETE FROM queues
        WHERE session_id = ${sid}
    `
    queue.forEach(async (song : any, index : number) => {
        await AddSongToQueue(
            song.songId, song.songName,
            song.albumCover, song.artistName,
            song.placement, sid)
    });
}
    

export async function GetHostName(session_id: string) {
    try {
        const result = await sql`
            SELECT users.username
            FROM users
            JOIN sessions ON users.user_id = sessions.host_id
            WHERE sessions.session_id = ${session_id};
        `;
        
        if (result.length === 0) {
            return null; 
        }
        
        return result[0]["username"];
    } catch (error) {
        console.error('Error fetching host name:', error);
        throw new Error('Error fetching host name from the database.');
    }
}


export async function DeleteSession(sid : string) : Promise<void> {

    // Deletes session with sid and cascades to all queues and users with sid
    const results = await sql`
        DELETE FROM sessions
        WHERE session_id = ${sid}
        RETURNING session_id
    `
    // Check if session_id existed
    if(results[0].length === 0) {
        throw new Error("sid does not exist")
    }
}
