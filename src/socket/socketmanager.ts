import { socketIO } from '@/src/socket/client'

const socketInstances: { [sid: string]: { [uuid: string] : any } } = {};

export function getSocketInstance(sid: string, uuid : string){
    if (!socketInstances[sid]) {
        console.log("create session: ", sid)
        socketInstances[sid] = {}; // initialize sid entry if not present
    }
    if (!socketInstances[sid][uuid]) {
        console.log("create session for: ", uuid)
        socketInstances[sid][uuid] = socketIO(sid); // initialize socket for this uuid
    }
    return socketInstances[sid][uuid];
  };
  
export function removeSocketInstance(sid: string, uuid: string){
    if (socketInstances[sid] && socketInstances[sid][uuid]) {
        socketInstances[sid][uuid].disconnect();
        console.log("delete session for: ", uuid)
        delete socketInstances[sid][uuid];
        
        // Clean up the sid if no users remain
        if (Object.keys(socketInstances[sid]).length === 0) {
            console.log("delete empty session: ", sid)
            delete socketInstances[sid];
        }
    }
};