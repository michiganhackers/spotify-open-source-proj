import { NextResponse } from "next/server";

// REQUIRES: req contains the access token of the host of the session
export async function POST(req: Request) {
    const reqData = await req.json();
    const access_token : string = reqData.accessToken;  

    var bearer = 'Bearer ' + access_token;
    const url = 'https://api.spotify.com/v1/me/player/currently-playing';
    const response = await fetch(url, { 
        credentials: 'same-origin',
        headers: {
            Authorization: bearer
        }
    });

    if(!response.ok)
        throw Error(`${response.status} ${response.statusText}`);

    const data = await response.json();

    console.log("data:", data.is_playing, data.progress_ms, data.item.duration_ms)
    
    return NextResponse.json(
        {
            is_playing: data.is_playing,
            progress_ms: data.progress_ms,
            duration_ms: data.item.duration_ms,
        },
        { status : 200 }
    )
}