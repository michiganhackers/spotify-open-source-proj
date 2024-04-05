import { Server } from "socket.io";
import { GetSessionData } from "../database/db"

const io = new Server({ 
    cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"]
    }
});

io.on("connection", (socket) => {
    // Add user to the database (call CreateUser function from db.ts)
    const sessionId : string = socket.handshake.auth.token;  

    // Add user to the room (session) in which they want to connect
    socket.join(sessionId);

    // Send all of the session data to the client so that their UI may be updated (call GetSessionData from db.ts)
    var hostName, clientNames, queue;
    GetSessionData(sessionId).then((data : any) => {
        hostName = data.hostName;
        clientNames = data.clientNames;
        queue = data.queue;
    })

    // Emits an initSession event listener for the client to listen for
    socket.to(sessionId).emit("initSession", hostName, clientNames, queue); 
});

io.listen(3000);