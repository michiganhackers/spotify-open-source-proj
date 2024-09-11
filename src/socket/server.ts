import { Server } from "socket.io";
import { GetAccessToken, GetQueue, GetSessionData, ReplaceQueue } from "../database/db"
import { handleSpotifyAuth } from "@/utils";
import 'dotenv/config'
import { log } from "console";
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

var checkQueueUpdatesInterval : any;
io.on("connection", (socket) => {

    const sid : string = socket.handshake.auth.token;  
    
    // Add user to the room (session) in which they want to connect
    socket.join(sid);

    // IDEA: Don't emit addSongToUI inside of sendSongToSocket
    //       Instead, have one function running a constant check for updates to the queue 
    /* TODO: IF HOST */
    if(checkQueueUpdatesInterval)
        clearInterval(checkQueueUpdatesInterval);

    checkQueueUpdatesInterval = setInterval(async () => {
        try {
            await checkQueueUpdates(sid, io);
        }
        catch (error : any) {
            console.error(error);
        }
    }, 5000);
    
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
        clearInterval(checkQueueUpdatesInterval);
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