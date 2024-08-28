import { stringify } from 'querystring';


export function handleSpotifyAuth(client_id : string | undefined, redirect_uri : string | undefined, scope : string | undefined) {

    const generateRandomString = function(length : number){
        return Math.random().toString(20).substring(2, length + 2)
    }

    var state = generateRandomString(16); // TODO: Needs to be verified by /api/spotify/getToken
    console.log(state);
    window.location.href = `https://accounts.spotify.com/authorize?${stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state
    })}`
}
