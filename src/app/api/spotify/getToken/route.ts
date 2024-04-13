/* API endpoint for adding a song to session queue */

import { redirect } from "next/navigation";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

const basic = btoa(`${client_id}:${client_secret}`);
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

// REQUIRES: req contains url of the song to fetch and sid of active session
export async function GET(req: Request) {
    const reqUrl = new URL(req.url);
    const code = reqUrl.searchParams.get('code');
    if (!code) {
        throw new Error('Authentication failed.');
    }
    // const state = reqUrl.searchParams.get('state');

    fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + basic
        },
        body: new URLSearchParams({
            code: code,
            redirect_uri: 'http://localhost:3000/api/spotify/getToken',
            grant_type: 'authorization_code'
        }),
    }).then((response) => {
        if(!response.ok)
            throw Error(response.statusText);
        return response.json();
    }).then((data) => {
        const { access_token, refresh_token } = data;
        console.log(process.env.APP_SERVER);
        fetch(process.env.APP_SERVER + '/api/sessionDB/create', { 
            method: 'POST',
            body: JSON.stringify({
                username : "", // TODO
                accessToken: access_token,
                refreshToken: refresh_token
            }) 
        });
    });

    redirect('/session');
}