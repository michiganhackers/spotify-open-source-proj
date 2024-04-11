/* API endpoint for adding a song to session queue */

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

const basic = btoa(`${client_id}:${client_secret}`);
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token
    })
  });

  return response.json();
};

// REQUIRES: req contains url of the song to fetch and sid of active session
export async function GET(req: Request) {
    const { query } = await req;
    const code: string = query.code;
    const state: string = query.state;

    fetch(TOKEN_ENDPOINT, {
        method: 'GET',
        form: {
            code: code,
            redirect_uri: 'http://localhost:3000/session',
            grant_type: 'authorization_code'
        },
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + client_id + ':' + client_secret
        },
        json: true
    }).then((response) => {
        if(!response.ok)
            throw Error(response.statusText);

        return response.json();
    })
    .then((data) => {
        //  Get all the relevant data from the returned JSON
        const songId = data.id
        const songName = data.name
        const albumCover = data.album.images[0].url
        const artistName = data.artists[0].name
        const placement = reqData.qlen + 1
        const addedBy = reqData.addedBy
        
        // Add song details to queue in the database
        AddSongToQueue(songId, songName, albumCover, artistName, placement, addedBy, sid, url);

        return { songId, songName, albumCover, artistName, placement, addedBy }
    })
}