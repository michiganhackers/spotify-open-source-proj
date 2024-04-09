/* API endpoint for adding a song to session queue */

import { AddSongToQueue, GetAccessToken } from "@/src/database/db";

// REQUIRES: req contains url of the song to fetch and sid of active session
export async function POST(req: Request) {
    // Inside of req, there should be a url for the server to fetch using the access token
    const reqData = await req.json();
    const url : string = reqData.url;
    const sid : string = reqData.sid;

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
        // TODO: Get all the relevant data from the returned JSON
        const songId = data.id
        const songName = data.name
        const albumCover = data.album.images[0].url
        const artistName = data.artists[0].name
        const placement = reqData.qlen + 1
        const addedBy = reqData.addedBy
        

        // Add song details to queue in the database
        AddSongToQueue(songId, songName, albumCover, artistName, placement, addedBy, sid);
    })
}