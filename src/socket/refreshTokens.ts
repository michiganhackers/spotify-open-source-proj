import { NextResponse } from 'next/server'
import 'dotenv/config'
import { GetRefreshToken, UpdateTokens } from '../database/db';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
//const basic = btoa(`${client_id}:${client_secret}`);

export async function updateTokens(sid : string) {
    
    const url = "https://accounts.spotify.com/api/token";

    const refreshToken = await GetRefreshToken(sid);

    console.log("refreshed: ", refreshToken)
    console.log("client_id: ", client_id)

    const payload = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        //  'Authorization': 'Basic ' + basic
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: client_id!,
          client_secret:client_secret!
        }),
      }

      try {
        // Fetch the response from Spotify API
        const response = await fetch(url, payload);
        
        // Check for a successful response
        if (!response.ok) {
            throw new Error(`Failed to refresh token: ${response.status}`);
        }

        // Parse the response JSON
        const data = await response.json();
        
        console.log("Token data: ", data);

        // Extract new tokens from the response
        const newAccessToken = data.access_token;

        console.log("tokens: ", newAccessToken)

        // Update the tokens in the database
        //change this i didnt realize that the thing only returns the access token and not another refresh token
        const confirm = await UpdateTokens(newAccessToken, refreshToken, sid);

        console.log("Token update confirmed: ", confirm);

        return; // No need to return anything unless you want to send a response
    } catch (error) {
        // Handle any errors that occurred during the token refresh or update process
        console.error('Error during token update process: ', error);
        throw error; // Optionally rethrow the error to handle it elsewhere
    }
}