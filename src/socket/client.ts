import { io } from "socket.io-client";

const SERVER = "localhost:8080"; // LATER: remove and add as env variable

export function socketIO(sid : string) {
    return io(SERVER, {
        auth: {   
            token: sid
        }
    }); // Initialize the client-side websocket
}