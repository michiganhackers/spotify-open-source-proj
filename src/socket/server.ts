import { Server } from "socket.io";
import { GetSessionData } from "../database/db"

const io = new Server({ 
    cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"]
    }
});

io.on("connection", (socket) => {

    const sid : string = socket.handshake.auth.token;  
    
    // Add user to the room (session) in which they want to connect
    socket.join(sid);

    var counter = 0;
    socket.on("sendSongToSocket", (songData) => {
        console.log(counter)
        console.log(songData)
        console.log("received song from client")
        io.to(sid).emit("addSongToUI", songData)
        console.log("sending song to session members at: " + sid)
        counter++;
    })


    socket.on("sendSongsToSearch", (songData) => {
        io.to(songData.sid).emit("addSongToUI", songData)
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