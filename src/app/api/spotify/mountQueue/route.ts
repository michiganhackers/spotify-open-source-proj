import { NextRequest, NextResponse } from 'next/server';
import { GetAccessToken } from '@/src/database/db';  // Adjust the path if necessary

// Handle POST request
export async function POST(request: NextRequest) {
    try {
        const { sid } = await request.json();

        console.log("recieved", { sid });

        const accesstoken = await GetAccessToken(sid);  // Call your ReplaceQueue function here

        console.log("acruied access token: ", accesstoken);

        //check access code write better after----
        if (!accesstoken) {
            console.error("Error in getaccesstoken: Access token not found");
            // Optionally send an error response or handle as needed
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

        // For each song grab relevant data and pass in response
        data.queue.forEach((song: any, index: number) => {
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
            { status: 200 }
        )

        // Rest of your code here that requires accesstoken
    } catch (error) {
        console.error("Error in somewhere:", error);
        NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }
}
