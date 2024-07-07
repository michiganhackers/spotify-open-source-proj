/* API endpoint for adding a song to session queue */

import { AddSongToQueue, GetAccessToken } from "@/src/database/db";
import { NextResponse } from "next/server";

// REQUIRES: req contains url of the song to fetch and sid of active session
export async function POST(req: Request) {
    // Inside of req, there should be a url for the server to fetch using the access token
    const reqData = await req.json();
    const url : string = reqData.url;
    const sid : string = reqData.sid;

    // Get the access token for the spotify api from the db for this session
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
    //  Get all the relevant data from the returned JSON
    const songId = data.id
    var songUri = data.uri;
    const songName = data.name
    const albumCover = data.album.images[0].url
    const artistName = data.artists[0].name
    const placement : number = reqData.qlen + 1
    const addedBy = reqData.addedBy

    // Add song to the user's spotify queue
    const queueResponse = await fetch('https://api.spotify.com/v1/me/player/queue?uri=' + songUri, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Authorization: bearer
        },
    })
        
    // Add song details to queue in the database
    console.log(songId);
    await AddSongToQueue(songId, songName, albumCover, artistName, placement, addedBy, sid, url);

    responseBody = { songId, songName, albumCover, artistName, placement, addedBy };

    return NextResponse.json(
        { responseBody },
        { status: 200 }
    )
}