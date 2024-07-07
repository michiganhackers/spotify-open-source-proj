import { stringify } from 'querystring';


export function handleSpotifyAuth(client_id : string | undefined, redirect_uri : string | undefined, scope : string | undefined) {

    window.location.href = `https://accounts.spotify.com/authorize?${stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
    })}`
}
