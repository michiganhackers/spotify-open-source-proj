import { NextResponse } from 'next/server'
import 'dotenv/config'
import { GetRefreshToken, UpdateTokens } from '../database/db';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const basic = btoa(`${client_id}:${client_secret}`);

// RETURNS:
//      true  -- successful update of access token
//      false -- failed update of access token
export async function updateTokens(sid : string) : Promise<boolean> {
    
    const url = "https://accounts.spotify.com/api/token";
    let refreshToken;
    try {
        refreshToken = await GetRefreshToken(sid);
    }
    catch (err) {
        console.error("@@@ Failed to obtain refreshToken:\n", err);
        return false;
    }

    const payload = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + basic
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
    }

    try {
        // Fetch the response from Spotify API
        const response = await fetch(url, payload);
        
        // Check for a successful response
        if (!response.ok) {
            console.error(`@@@ Failed to refresh token with Spotify API: ${response.status}`);
            return false;
        }

        // Parse the response JSON
        const data = await response.json();

        // Extract new tokens from the response
        const newAccessToken = data.access_token;
        const expires_in : number = data.expires_in;
        let newRefreshToken : string;
        if('refresh_token' in data) {
            newRefreshToken = data.refresh_token;
        }
        else {
            newRefreshToken = refreshToken;
        }

        const now : any = Date.now();
        const expiration = new Date(now + (expires_in * 1000)).toISOString(); // Time of expiration, expressed in "YYYY-MM-DDT00:00:00Z" (ISO format)

        // Update the tokens in the database
        let confirm;
        try {
            confirm = await UpdateTokens(newAccessToken, newRefreshToken, expiration, sid);
        }
        catch (err) {
            console.error("@@@ Failed to update tokens in DB:\n", err);
            return false;
        }

        return true; // No need to return anything unless you want to send a response
    } catch (error) {
        console.error('@@@ Error during token update process:\n', error);
        return false;
    }
}