'use client'
import { stringify } from 'querystring';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { Router } from 'next/router';
require('dotenv').config();

export default function Home() {
  const [guestCode, setGuestCode] = useState("");
  const [username, setUsername] = useState("");

  const router = useRouter();
  
  useEffect(() => {
    // This effect will run only on the client side
    // You can place any client-side specific logic here
  }, []); // Empty dependency array ensures the effect runs only once on mount

  const handleSpotifyAuth = () => {
    var client_id = "7427c1385e5941aea9bd97ab44b76ae0"; // Ashton's client code for testing
    var redirect_uri = 'http://localhost:3000/api/spotify/getToken'
  
    // var state = generateRandomString(16);
    var scope = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
    // var state = username;
  
    window.location.href = `https://accounts.spotify.com/authorize?${stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        // state: state // state represents the hosts username here
      })}`
  }
  
  // TODO: Add input for username for both host and guest options
  return (
    <main className="background flex min-h-screen flex-col items-center justify-between p-24">
      <img src="GMJ-emblem-color.svg" alt="" />
      <div className="options">
        <div className="hostoptions">
            <h1>I'm a host:</h1>
            <form data-testid="host-form">
                <input type="text" placeholder='Username' maxLength={6} name="username" onChange={(e) => setUsername(e.target.value)}/>
            </form>
            <button className="SubmitButton" onClick={() => {
                sessionStorage.setItem("username", username);
                sessionStorage.setItem("isHost", "true");
                handleSpotifyAuth()
                }}>
                Host a Jam
            </button>
        </div>
        <div className="divideDiv">
        <hr className="divider"></hr>
        </div>
        
        <div className="guestoptions">
            <h1>I'm a guest:</h1>
            <form data-testid="guest-form">
                <input type="text" placeholder='Guest Code' maxLength={8} name="guestcode"  onChange={(e) => setGuestCode(e.target.value.toUpperCase())}/>
                <input type="text" placeholder='Username' maxLength={25} name="username" onChange={(e) => setUsername(e.target.value)}/>
            </form>
            <button className="SubmitButton" onClick={() => {
                sessionStorage.setItem("username", username);
                sessionStorage.setItem("isHost", "true");
                connectToSession(guestCode, username, router)}}>
                    Join
            </button>
        </div>
      </div>
    </main>
  );
}

async function connectToSession(guestCode : string, username : string, router : any) : Promise<void> { 
    

  try {
    await fetch('api/sessionDB/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          guestCode: guestCode,
          username: username
      }),
    }).then((response) => {
        if(!response.ok)
            throw Error(response.statusText);

        return response.json();
    }).then((data) => {
        const url = data.url;
        router.push(url);
    })
  }
  catch(e){
    // Add some error message to user saying that wrong code was entered
    
  }
}

