import { stringify } from 'querystring';


export async function handleSpotifyAuth(client_id : string | undefined, redirect_uri : string | undefined, scope : string | undefined) {

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/spotify/setState`)
    const data = await response.json()
    window.location.href = `https://accounts.spotify.com/authorize?${stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: data.state
    })}`
}

//songID vs song_id => when fetching straight from spotify its the former, from database its the latter
export function getValue(data: any, key: string) {
    return data[key] ?? data[key.replace(/([A-Z])/g, '_$1').toLowerCase()];
  }


// General purpose sleep function
export function sleep(seconds : number) {
    const ms : number = seconds * 1000;
    return new Promise(resolve => setTimeout(resolve, ms));
}