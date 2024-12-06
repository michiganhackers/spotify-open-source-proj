import { DeleteSession, GetAccessToken, GetQueue, ReplaceQueue } from "../database/db"

// Goals for this class:
//      - Create an instance of WebSocketController at top level of server.ts
//      - As users connect and disconnect, track the number of users for a given session
//      - When a new sid is identified, call addSessionInterval to create a new "thread" that will check for queue disparities every X seconds
//      - If after a user leaves, the number of users for a given session == 0, set a timeout that will check in Y seconds if the number of users still == 0, 
//        if so, call destroySession(sid)
export class WebSocketController {
    private io : any;
    private checkQueueUpdatesIntervals : Map<string, any>; // checkQueueUpdates intervalID for each sid
    private userCounts : Map<string, number>; // # of users per sid
    private currentSongProgress: Map<
        string,
        { progress: number; lastUpdated: number; isPlaying: boolean; duration: number }
    >;


    /* ----- Public member functions ----- */
    
    constructor(io : any) {
        this.io = io;
        this.checkQueueUpdatesIntervals = new Map<string, any>();
        this.userCounts = new Map<string, number>();
        this.currentSongProgress = new Map();
    }


    // Adds new {sid, intervalID} to checkQueueUpdatesIntervals
    public addSessionInterval(sid : string) : void {
        // Check if session already exists, if it does, simply increment user cound
        if(this.checkQueueUpdatesIntervals.has(sid)) {
            this.incrementUserCount(sid);
            return;
        }
        // Calls checkQueueUpdates every 5 seconds
        let intervalID = setInterval(async () => {
            try {
                await this.checkQueueUpdates(sid, this.io);
            }
            catch (error : any) {
                console.error(error);
            }
        }, 5000)
        this.checkQueueUpdatesIntervals.set(sid, intervalID); // Add unique intervalID to 
        this.userCounts.set(sid, 1); // Initialize user count for session

        this.currentSongProgress.set(sid, { progress: 0, lastUpdated: 0, isPlaying: false, duration: 0 });
    }


    public incrementUserCount(sid : string) : void {
        var userCount : number = this.userCounts.get(sid) || 0;
        let newUserCount : number = userCount + 1;
        this.userCounts.set(sid, newUserCount);
        console.log("Session " + sid + " now has " + this.userCounts.get(sid) + " users!")
    }
    

    // Called when socket disconnects
    public decrementUserCount(sid : string) : void {
        var userCount : number = this.userCounts.get(sid) || 0;
        let newUserCount : number = userCount - 1;
        if(userCount !== 0) {
            this.userCounts.set(sid, newUserCount);
            console.log("Session " + sid + " now has " + this.userCounts.get(sid) + " users!")
        }

        if(this.userCounts.get(sid) === 0) {
            console.log("Starting 10 second timeout...");
            // Wait X minutes to ensure that nobody is coming back to the session 
            // This is for the case where the host leaves the app and never manually shuts down the session
            // Not a guaranteed solution, just a heuristic so that we can estimate when nobody is using the app anymore
            setTimeout(() => {
                if(this.userCounts.get(sid) === 0) {
                    console.log("Terminating session interval and database information");
                    this.destroySession(sid);
                }
            }, 10000)
        }
    }


    // Called whenever the server receives an 'EndSession' event emission
    public async endSession(sid : string) : Promise<void> {
        await this.destroySession(sid);

        // Broadcast to all users in session that it has ended
        this.io.to(sid).emit("SessionEnded"); // Send updated queue to all users in session
    }


    // Called whenever the server receives an 'AddedSong' event emission
    public async checkQueue(sid : string) : Promise<void> {
        await this.checkQueueUpdates(sid, this.io);
    }

    
    /* ----- Private member functions ----- */


    // Call when userCounts[sid] == 0 after some timeout period
    // Deletes memory inside of WebSocketController related to session with sid
    private async destroySession(sid : string) : Promise<void> {
        // Clear interval and remove from map
        clearInterval(this.checkQueueUpdatesIntervals.get(sid));
        this.checkQueueUpdatesIntervals.delete(sid);
        
        // Remove session data from the database
        try {
            await DeleteSession(sid);
        }
        catch(e) {
            console.log(e);
        }
        
    }


    // Checks queue for changes, and sends updated queue to database and users if there are
    private async checkQueueUpdates(sid : string, io : any) : Promise<boolean> {
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

    private async syncSongProgress(sid: string, io: any): Promise<void> {
        try {
          const access_token = await GetAccessToken(sid);
          const bearer = "Bearer " + access_token;
          const url = "https://api.spotify.com/v1/me/player/currently-playing";
      
          const response = await fetch(url, {
            credentials: "same-origin",
            headers: {
              Authorization: bearer,
            },
          });
      
          if (!response.ok) {
            console.log(`Error fetching data for session ${sid}: ${response.statusText}`);
            return;
          }
      
          const data = await response.json();
          const is_playing = data.is_playing;
          const progress_ms = data.progress_ms;
          const duration_ms = data.item.duration_ms;
    
          const id = data.item.album.id;
      
          const storedSong = this.currentSongProgress.get(sid);
          
          console.log(storedSong!.progress, " - ", progress_ms, " : ", Math.abs(storedSong!.progress - progress_ms) >= 1000);
          
          if (
            !storedSong ||
            Math.abs(storedSong.progress - progress_ms) >= 1000 ||
            storedSong.isPlaying !== is_playing ||
            storedSong.duration !== duration_ms
          ) {
            this.currentSongProgress.set(sid, {
              progress: progress_ms,
              lastUpdated: Date.now(),
              isPlaying: is_playing,
              duration: duration_ms,
            });
    
            console.log("sent:", sid, ":", is_playing, progress_ms, duration_ms, " : ", id);
            io.to(sid).emit("retrieveProgress", { is_playing, progress_ms, duration_ms, id });
          }
        } catch (error) {
          console.error(`Failed to sync song progress for session ${sid}:`, error);
        }
      }
};