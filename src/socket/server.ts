import { Server } from "socket.io";
import { GetAccessToken, GetQueue, GetSessionData, ReplaceQueue } from "../database/db"
import { handleSpotifyAuth } from "@/src/utils";
import 'dotenv/config'
import { error, log } from "console";
import { deprecate } from "util";

/* const client_id : string | undefined = process.env.SPOTIFY_WSS_CLIENT_ID;
const redirect_uri : string | undefined = process.env.WS_SERVER;
const scope : string = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
handleSpotifyAuth(client_id, redirect_uri, scope); */

const io = new Server({ 
    cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"]
    }
});

const activeSessions: Map<string, number> = new Map();

var checkQueueUpdatesInterval : any;
var songtime : any;

function startIntervals() {
    if(checkQueueUpdatesInterval)
        clearInterval(checkQueueUpdatesInterval);

    checkQueueUpdatesInterval = setInterval(async () => {
        try {
            activeSessions.forEach(async (users, sid) => {
                await checkQueueUpdates(sid, io);
            });
        }
        catch (error : any) {
            console.error(error);
        }
    }, 5000);

    if(songtime)
        clearInterval(songtime);

    songtime = setInterval(async () => {
        try {
            activeSessions.forEach(async (users, sid) => {
                await songUpdateBar(sid, io);
            });
        } catch (error: any) {
            console.error(error);
        }
    }, 1000);
}

//i just realized this is completely irrelevant because the setInterval only for sids that exist...
//if no sids and users exist, then the intervals just wont run because everyone disconnected anyway
function stopIntervals() {
    if (activeSessions.size === 0) {
        console.log("closing interval")
        clearInterval(checkQueueUpdatesInterval);
        clearInterval(songtime);
    }
}

io.on("connection", (socket) => {

    const sid : string = socket.handshake.auth.token;

    if (activeSessions.has(sid)) {
        console.log("adding session user: ", sid)
        activeSessions.set(sid, activeSessions.get(sid)! + 1) //the ! thing is acc so cool (tells ts its not null)
    } else {
        console.log("creating new session with user: ", sid)
        activeSessions.set(sid, 1);
        startIntervals() 
    } 
    
    // Add user to the room (session) in which they want to connect
    socket.join(sid);

    // IDEA: Don't emit addSongToUI inside of sendSongToSocket
    //       Instead, have one function running a constant check for updates to the queue 
    /* TODO: IF HOST */
    
    
    var counter = 0;
    socket.on("sendSongToSocket", (songData) => {
        console.log(counter)
        console.log(songData)
        console.log("received song from client")

        socket.to(sid).emit("addSongToUI", songData) // Send the song to ALL users in the session (including sender)
        console.log("sending song to session members at: " + sid)
        counter++;
    })

    socket.on("sendSongsToSearch", (songData) => {
        socket.broadcast.to(songData.sid).emit("addSongToUI", songData)
    })

    socket.on("disconnect", () => {
        console.log("Disconnecting from socket for " + sid);

        if (activeSessions.has(sid)) {
            const users = activeSessions.get(sid)! - 1;
            
            if(users < 0){
                throw error("users count was somehow less than 0: ", sid)
            }
            else if (users == 0) {
                //eventually later implement differentiating between a session host leaving and a session listener leaving
                console.log("no users left in the session: ", sid)
                activeSessions.delete(sid)
                //do we actually need this?
                //stopIntervals();
            } else {
                // Update the count for the session
                console.log(`${users} users left in the session: `, sid)
                activeSessions.set(sid, users);
            }
        }
    })
});


io.listen(8080);


async function checkQueueUpdates(sid : string, io : any) : Promise<boolean> {
    console.log("Checking queue disparities for " + sid);
    const access_token = await GetAccessToken(sid);
    const url = 'http://localhost:3000/api/spotify/getQueue';
    const response = await fetch(url, { 
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            accessToken: access_token
        })
    });

    if(!response.ok)  {
        console.error(response.statusText);
        return false; // DB queue doesn't change, return false
    }

    const data = await response.json();

    const queue : any[] = data.queue;
    const dbQueue : any[] = await GetQueue(sid);
        
    for(let index = 0; index < queue.length; index++) {
        let songId : string = queue[index].songId;

        // Song comparison logic to current database state
        if(queue.length !== dbQueue.length || songId != dbQueue[index].song_id) {
            console.log("Found queue disparity!");
            await ReplaceQueue(sid, queue); // Replace queue in DB
            io.to(sid).emit("UpdateQueueUI", queue); // Send updated queue to all users in session
            return true;
        }
    }

    return false; // No Queue changes detected
}

async function songUpdateBar(sid: string, io: any): Promise<void> {
    try {
        const access_token = await GetAccessToken(sid);
        const bearer = 'Bearer ' + access_token;
        const url = 'https://api.spotify.com/v1/me/player/currently-playing';

        const response = await fetch(url, { 
            credentials: 'same-origin',
            headers: {
                Authorization: bearer
            }
        });

        // Check for fetch errors and log them without halting the server
        if (!response.ok) {
            console.log(`Error fetching data for session ${sid}: ${response.statusText}`);
            return; // Exit if there's a problem
        }

        /*
        const url = 'http://localhost:3000/api/spotify/currentPlaying';
        const response = await fetch(url, { 
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                accessToken: access_token
            })
        });

        if (!response.ok) {
            console.error(response.statusText);
            return; // Return if there was an error in fetching the data
        }
        */

        const data = await response.json();
        const is_playing = data.is_playing;
        const progress_ms = data.progress_ms;
        const duration_ms = data.item.duration_ms;

        

        //make sure the song is playing to then send the info
        if(is_playing){
            // send the data to the specific session
            console.log("sent:", sid, ":", is_playing, progress_ms, duration_ms);
            io.to(sid).emit("retrieveProgress", { is_playing, progress_ms, duration_ms });
        }else{
            console.log("song not playing")
        }
        
    } catch (error) {
        console.error(`Failed to update song progress for session ${sid}:`, error);
    }
}

