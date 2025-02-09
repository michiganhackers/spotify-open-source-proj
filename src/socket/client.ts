import { io } from "socket.io-client";
import 'dotenv/config'

const SERVER = process.env.NEXT_PUBLIC_WS_SERVER;

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
