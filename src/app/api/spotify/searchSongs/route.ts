/* API endpoint for searching song from spotify*/

import { AddSongToQueue, GetAccessToken } from "@/src/database/db";

// REQUIRES: req contains url of the song to fetch and sid of active session
export async function GET(req: Request) {
    // Inside of req, there should be a url for the server to fetch using the access token
    const reqData = await req.json();
    const url : string = "https://api.spotify.com/v1/search?q=name:" + reqData.songName + "&type=track&limit=5";
    const sid : string = reqData.sid;
    //q=name:<user_input>&type=track
    // Search the database to see if the song is already queued

    // TODO: Get the access token for the spotify api from the db for this session
    var access_token = await GetAccessToken(sid)
    // Retrieve song data from the spotify api endpoint
    var bearer = 'Bearer ' + access_token;
    fetch(url, { 
        credentials: 'same-origin',
        headers: {
            Authorization: bearer
        }
    }).then((response) => {
        if(!response.ok)
            throw Error(response.statusText);

        return response.json();
    })
    .then((data) => {
        //  Get all the relevant data from the returned JSON
        const song_results : any = []

        if(data.items.length > 0) {
            data.items.forEach((item : any) => {
                song_results.push({
                    "songId": item.id,
                    "songName": item.name,
                    "albumCover": item.album.images[0].url,
                    "artistName": item.artists[0].name
                })
            });
        }
        
        return song_results;
    })
}