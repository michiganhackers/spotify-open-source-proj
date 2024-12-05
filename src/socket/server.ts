import { Server } from "socket.io";
import 'dotenv/config'
import { WebSocketController } from "./WebSocketController";

const io = new Server({ 
    cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"]
    }
});


const controller = new WebSocketController(io);


// let checkQueueUpdatesIntervals = new Map<string, any>();
// var checkQueueUpdatesInterval : any;
io.on("connection", (socket) => {

    // Add user to the room (session) in which they want to connect
    const sid : string = socket.handshake.auth.token;  
    const headers : any = socket.handshake.headers;
    const isHost = headers['is-host'];
    console.log("Connection at " + socket.id);
    socket.join(sid);

    if(isHost === "true")
        controller.addSessionInterval(sid);
    else
        controller.incrementUserCount(sid);


    /* ----- EVENT LISTENERS ----- */

    //  User adds song to queue => we should automatically call checkQueueUpdates in our controller
    socket.on("AddedSong", async () => {
        console.log("received added song emission")
        await controller.checkQueue(sid);
    });
    
    //  Host presses end session button => we should call controller.deleteSession()
    socket.on("EndSession", async () => {
        console.log("received end session emission")
        await controller.endSession(sid);
    });

    // User disconnects from session
    socket.on("disconnect", () => {
        console.log("Disconnecting socket id: " + socket.id);
        controller.decrementUserCount(sid); // Remove user from session in controller
    })
});


io.listen(8080);