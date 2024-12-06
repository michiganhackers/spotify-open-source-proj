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
        throw Error(`${response.status} ${response.statusText}`);

    const data = await response.json();
    const queue : any[] = [];

    if(data.currently_playing == null) { // Nothing is currently playing, return empty queue
        return NextResponse.json(
            { queue },
            { status : 200 }
        )
    }
    const currentSong = data.currently_playing;
    const currentSongObject = {
        songId: currentSong.id,
        songName: currentSong.name,
        albumCover: currentSong.album.images[0].url,
        artistName: currentSong.artists[0].name,
        placement: 1
    }
    queue.push(currentSongObject);

    // For each song grab relevant data and pass in response
    data.queue.forEach((song : any, index : number) => {
        const songObject = {
            songId: song.id,
            songName: song.name,
            albumCover: song.album.images[0].url,
            artistName: song.artists[0].name,
            placement: index + 2    // Accounts for currently playing and 1-based indexing for placement value
        }
        queue.push(songObject);
    })

    return NextResponse.json(
        { queue },
        { status : 200 }
    )
}