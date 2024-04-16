/* API endpoint for adding a song to session queue */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from 'next/server'
import 'dotenv/config'

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

    //TODO: Replace host with username (consider appending username to redirect_uri in initial call)
    const username = "host";

    var accessToken, refreshToken : string;
    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + basic
        },
        body: new URLSearchParams({
            code: code,
            redirect_uri: process.env.APP_SERVER + '/api/spotify/getToken',
            grant_type: 'authorization_code'
        }),
    });
        
    if(!tokenResponse.ok)
        throw Error(tokenResponse.statusText);
    
    const data = await tokenResponse.json();
    accessToken = data.access_token;
    refreshToken = data.refresh_token;

    const createResponse = await fetch(process.env.APP_SERVER + '/api/sessionDB/create', { 
        method: 'POST',
        body: JSON.stringify({
            username : username,
            accessToken: accessToken,
            refreshToken: refreshToken
        }) 
    })
    
    if(!createResponse.ok) {
        console.log(createResponse.statusText);
    }

    const createData = await createResponse.json();
    const sid = createData.sid;
    
    return NextResponse.redirect(new URL(`/session/${sid}`, process.env.APP_SERVER));
  /* return NextResponse.json(
    { accessToken: accessToken, refreshToken: refreshToken },
    { status: 201 }
   ) */
}