'use client'
import { stringify } from 'querystring';
import { useState, useEffect } from 'react';


export default function Home() {
  const [guestCode, setGuestCode] = useState("");
  
  useEffect(() => {
    // This effect will run only on the client side
    // You can place any client-side specific logic here
  }, []); // Empty dependency array ensures the effect runs only once on mount

  const handleLogin = () => {
    var client_id = 'c1aa1eb2682247c4a3b964477b701969'; // Andrew's client code for testing
    var redirect_uri = 'http://localhost:3000/api/spotify/getToken'
  
    // var state = generateRandomString(16);
    var scope = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
  
    window.location = `https://accounts.spotify.com/authorize?${stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        // state: state
      })}`
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <img src="GMJ-emblem-color.svg" alt="" />
      <div className="options">
        <div className="hostoptions">
            <h1>I'm a host:</h1>
            <button className="SubmitButton" onClick={handleLogin}> Host a Jam </button>
        </div>
        <div className="divideDiv">
        <hr className="divider"></hr>
        </div>
        
        <div className="guestoptions">
            <h1>I'm a guest:</h1>
            <form data-testid="comment-form" onSubmit={(e) => {e.preventDefault(); connectToSession(guestCode);} }>
                <input type="text" maxLength={6} name="guestcode" value={guestCode} onChange={(e) => setGuestCode(e.target.value.toUpperCase())}/>
            </form>
            <button className="SubmitButton" onClick={() => {connectToSession(guestCode)}}>Join</button>
        </div>
      </div>
    </main>
  );
}

async function connectToSession(guestCode : string) : Promise<void> {
  console.log(guestCode);  
  try {
    await fetch('api/sessionDB/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          guestCode: guestCode
      }),
    });
  }
  catch(e){
    // Add some error message to user saying that wrong code was entered
  }
}
