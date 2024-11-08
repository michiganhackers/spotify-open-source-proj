/* API endpoint for searching song from spotify*/

import { AddSongToQueue, GetAccessToken } from "@/src/database/db";
import { NextResponse } from 'next/server'

// REQUIRES: req contains url of the song to fetch and sid of active session
export async function POST(req: Request) {
    // Inside of req, there should be a url for the server to fetch using the access token
    const reqData = await req.json();
    const url : string = "https://api.spotify.com/v1/search?q=" + reqData.songName + "&type=track&limit=10";
    const sid : string = reqData.sid;
    //q=name:<user_input>&type=track  

    // TODO: Get the access token for the spotify api from the db for this session
    var access_token = await GetAccessToken(sid)
    // Retrieve song data from the spotify api endpoint
    var bearer = 'Bearer ' + access_token;

    const song_results : any[] = []
    const response = await fetch(url, {      
        credentials: 'same-origin',  
        headers: {
            'Content-Type': 'application/json',
            'Authorization': bearer,
        }
    });

    if(!response.ok)
        throw Error(response.statusText);

    const data = await response?.json();
    const items : any[] = data.tracks.items;

    if(items.length > 0) {
        items.forEach((item : any) => {
            song_results.push({
                "songId": item.id,
                "songName": item.name,
                "albumCover": item.album.images[0].url,
                "artistName": item.artists[0].name
            })
        });
    }

    return NextResponse.json(
        { song_results },
        { status: 201 }
    )
}