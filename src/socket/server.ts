import { Server } from "socket.io";
import { GetAccessToken, GetQueue, ReplaceQueue } from "../database/db"
import 'dotenv/config'

const io = new Server({ 
    cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"]
    }
});

// Goals for this class:
//      - Create an instance of WebSocketController at top level of server.ts
//      - As users connect and disconnect, track the number of users for a given session
//      - When a new sid is identified, call addSessionInterval to create a new "thread" that will check for queue disparities every X seconds
//      - If after a user leaves, the number of users for a given session == 0, set a timeout that will check in Y seconds if the number of users still == 0, 
//        if so, call destroySession(sid)
class WebSocketController {
    private io : any;
    private checkQueueUpdatesIntervals : Map<string, any>; // checkQueueUpdates intervalID for each sid
    private userCounts : Map<string, number>; // # of users per sid

    
    constructor(io : any) {
        this.io = io;
        this.checkQueueUpdatesIntervals = new Map<string, any>();
        this.userCounts = new Map<string, number>();
    }


    // Adds new {sid, intervalID} to checkQueueUpdatesIntervals
    public addSessionInterval(sid : string) : void {
        // Calls checkQueueUpdates every 5 seconds
        let intervalID = setInterval(async () => {
            try {
                await checkQueueUpdates(sid, io);
            }
            catch (error : any) {
                console.error(error);
            }
        }, 5000)
        checkQueueUpdatesIntervals.set(sid, intervalID); // Add unique intervalID to 
    }
    

    // Called when socket disconnects
    public decrementUserCount(sid : string) : void {
        var userCount : number = this.userCounts.get(sid) || 0;
        let newUserCount : number = userCount - 1;
        if(userCount !== 0)
            this.userCounts.set(sid, newUserCount);

        if(userCount === 0) {
            // Wait X minutes to ensure that nobody is coming back to the session 
            // This is for the case where the host leaves the app and never manually shuts down the session
            // Not a guaranteed solution, just a heuristic so that we can estimate when nobody is using the app anymore
            setTimeout(() => {
                if(userCount === 0) {
                    this.destroySession(sid);
                }
            }, 10000)
        }
    }


    // Call when userCounts[sid] == 0 after some timeout period
    // Deletes memory inside of WebSocketController related to session with sid
    private destroySession(sid : string) : void {
        this.checkQueueUpdatesIntervals.delete(sid);
        // Remove database data here
    }
};

let checkQueueUpdatesIntervals = new Map<string, any>();
var checkQueueUpdatesInterval : any;
io.on("connection", (socket) => {

    const sid : string = socket.handshake.auth.token;  
    console.log("Connection at " + socket.id);
    // Add user to the room (session) in which they want to connect
    socket.join(sid);

    // IDEA: Don't emit addSongToUI inside of sendSongToSocket
    //       Instead, have one function running a constant check for updates to the queue 
    /* TODO: IF HOST */
    if(checkQueueUpdatesIntervals.has(sid))
        clearInterval(checkQueueUpdatesIntervals.get(sid));

    checkQueueUpdatesIntervals.set(sid, setInterval(async () => {
        try {
            await checkQueueUpdates(sid, io);
        }
        catch (error : any) {
            console.error(error);
        }
    }, 5000));
    
    /*
    ** DEPRECATED **

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
    }) */

    socket.on("disconnect", () => {
        console.log("Disconnecting socket id: " + socket.id);
        clearInterval(checkQueueUpdatesIntervals.get(sid));
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