import { io } from "socket.io-client";

const SERVER = "http://localhost:8080"; // LATER: remove and add as env variable

export function socketIO(sid : string, isHost : boolean) {
    return io(SERVER, {
        auth: {   
            token: sid
        },
        extraHeaders: {
            "is-host": (isHost ? "true" : "false")
        },
        autoConnect: false,
    }); // Initialize the client-side websocket
}
