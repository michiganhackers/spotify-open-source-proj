/* API endpoint for adding a song to session queue */

import { AddSongToQueue, GetAccessToken } from "@/src/database/db";
import { NextResponse } from "next/server";

// REQUIRES: req contains url of the song to fetch and sid of active session
export async function POST(req: Request) {
    const reqData = await req.json();
    const songId : string = reqData.songId;
    const url : string = "https://api.spotify.com/v1/tracks/" + songId;
    const sid : string = reqData.sid;

    // Get the access token from db for this session
    var access_token = await GetAccessToken(sid)
    
    // Retrieve song data from the spotify api endpoint
    var responseBody : any = {};
    var bearer = 'Bearer ' + access_token;
    const response = await fetch(url, { 
        credentials: 'same-origin',
        headers: {
            Authorization: bearer
        }
    });

    if(!response.ok)
        throw Error(response.statusText);    

    const data = await response.json();
    
    // Add song details to queue in the database
    const songUri = data.uri;
    const songName = data.name
    const albumCover = data.album.images[0].url
    const artistName = data.artists[0].name
    const placement : number = reqData.qlen + 1 // ISSUE: Could be incorrect if autoplay songs (songs not directly queued) are also returned as part of queue

    await AddSongToQueue(songId, songName, albumCover, artistName, placement, sid);

    // Add song to the user's spotify queue
    const queueResponse = await fetch('https://api.spotify.com/v1/me/player/queue?uri=' + songUri, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Authorization: bearer
        },
    })

    responseBody = { songId, songName, albumCover, artistName, placement };

    return NextResponse.json(
        { responseBody },
        { status: 200 }
    )
}