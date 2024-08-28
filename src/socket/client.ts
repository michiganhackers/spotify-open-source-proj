import { io } from "socket.io-client";

const SERVER = "http://localhost:8080"; // LATER: remove and add as env variable

export function socketIO(sid : string) {
    return io(SERVER, {
        auth: {   
            token: sid
        },
        autoConnect: false,
    }); // Initialize the client-side websocket
}