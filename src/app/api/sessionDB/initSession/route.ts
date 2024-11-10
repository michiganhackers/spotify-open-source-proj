import { GetSessionData, GetAccessToken, AddSongToQueue } from '@/src/database/db';
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const body = await req.json();
    const sid = body.sid;

    var sessionData : any = await GetSessionData(sid);

    //if the database returned nothing, mount the queue straight from spotify and push to the database
    if (sessionData.queue.length === 0) {
        try {
            const accesstoken = await GetAccessToken(sid);
    
            //check access code write better after----
            if (!accesstoken) {
                console.error("Error in getaccesstoken: Access token not found");
                NextResponse.json({ error: 'Access token not found' }, { status: 500 });
                return; // Stop execution if there's no access token
            }
    
            // Continue with code that depends on accesstoken
            console.log("Access token obtained:", accesstoken);
    
            var bearer = 'Bearer ' + accesstoken;
            const url = 'https://api.spotify.com/v1/me/player/queue';
            const response = await fetch(url, {
                credentials: 'same-origin',
                headers: {
                    Authorization: bearer
                }
            });
    
            if (!response.ok)
                throw Error("access token: " + accesstoken + " response code: " + response.status);
    
            const data = await response.json();
            const queue: any[] = [];
    
            if (data.currently_playing == null) { // Nothing is currently playing, return empty queue
                return NextResponse.json(
                    { queue },
                    { status: 200 }
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

            //adds the freshly fetched songqueue into the database
            AddSongToQueue(currentSong.id,
                           currentSong.name,
                           currentSong.album.images[0].url,
                           currentSong.artists[0].name,1,
                           sid)
    
            // For each song grab relevant data and pass in response
            data.queue.forEach((song: any, index: number) => {
                const songObject = {
                    songId: song.id,
                    songName: song.name,
                    albumCover: song.album.images[0].url,
                    artistName: song.artists[0].name,
                    placement: index + 2    // Accounts for currently playing and 1-based indexing for placement value
                }
                
                //adds the freshly fetched songqueue into the database
                AddSongToQueue(song.id,song.name,song.album.images[0].url,song.artists[0].name,index + 2,sid)

                queue.push(songObject);
            })
    
            sessionData.queue = queue
    
        } catch (error) {
            console.error("Error in somewhere:", error);
            NextResponse.json({ error: 'error retrieving song queue' }, { status: 500 });
        }
    }

    return NextResponse.json(
        sessionData,
        { status : 201 }
    )
}