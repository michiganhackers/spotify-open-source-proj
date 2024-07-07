import { Server } from "socket.io";
import { GetAccessToken, GetQueue, GetSessionData } from "../database/db"
import { handleSpotifyAuth } from "@/utils";
import 'dotenv/config'

/* const client_id : string | undefined = process.env.SPOTIFY_WSS_CLIENT_ID;
const redirect_uri : string | undefined = process.env.WS_SERVER;
const scope : string = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
handleSpotifyAuth(client_id, redirect_uri, scope); */

const io = new Server({ 
    cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"]
    }
});

io.on("connection", (socket) => {

    const sid : string = socket.handshake.auth.token;  
    
    // Add user to the room (session) in which they want to connect
    socket.join(sid);

    // IDEA: Don't emit addSongToUI inside of sendSongToSocket
    //       Instead, have one function running a constant check for updates to the queue
    async function checkQueueUpdates(sid : string) {
        var access_token = await GetAccessToken(sid);
        var responseBody : any = {};
        var bearer = 'Bearer ' + access_token;
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

        if(!response.ok)
            throw Error(response.statusText);    
    
        const data = await response.json();

        const queue : any[] = data.queueNames;
        console.log(queue);
    /*    const dbQueue : any[] = await GetQueue(sid);
        queue.forEach((song) => {
            // Song comparison logic to current database state

            // If differences update database using /db.ts/ReplaceQueue()
        }) */
    }

    checkQueueUpdates(sid);
  // const checkQueueUpdatesInterval = setInterval(() => {checkQueueUpdates(sid)}, 1000);

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
    /*
    // Add user to the database (call CreateUser function from db.ts)
    const sid : string = socket.handshake.auth.token;  
    console.log(sid)
    
    // Add user to the room (session) in which they want to connect
    socket.join(sid);

    // Send all of the session data to the client so that their UI may be updated (call GetSessionData from db.ts)
    var sessionData : {hostName: string, clientNames : string[], queue : any[]};
    GetSessionData(sid).then((data : any) => {
        sessionData = { hostName: data.hostName,
                     clientNames: data.clientNames, 
                     queue: data.queue };
                     
        console.log(sessionData);
        // Emits an initSession event listener for the client to listen for
        socket.emit("initSession", sessionData);
    })
    */
});

io.listen(8080);