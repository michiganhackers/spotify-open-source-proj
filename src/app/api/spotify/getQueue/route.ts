import { GetAccessToken } from "@/src/database/db";
import { NextResponse } from "next/server";

// REQUIRES: req contains the access token of the host of the session
export async function POST(req: Request) {
    const reqData = await req.json();
    const access_token : string = reqData.accessToken;

    var bearer = 'Bearer ' + access_token;
    const url = 'https://api.spotify.com/v1/me/player/queue';
    const response = await fetch(url, { 
        credentials: 'same-origin',
        headers: {
            Authorization: bearer
        }
    });

    if(!response.ok)
        throw Error(response.statusText);    

    const data = await response.json();
    const queue : any[] = data.queue;

    var queueNames : any[] = [];
    queue.forEach((song) => {
        queueNames.push(song.name);
    })

    return NextResponse.json(
        { queueNames },
        { status : 200 }
    )
}