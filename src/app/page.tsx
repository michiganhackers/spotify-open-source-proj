'use client'
import { stringify } from 'querystring';
import { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation'
import { Router } from 'next/router';
import { handleSpotifyAuth } from '@/src/utils';
import 'dotenv/config';

export default function Home() {
  const [guestCode, setGuestCode] = useState(""); // Can be set as Next.js cookie and passed into server side session/[id]/page.tsx
  const [username, setUsername] = useState(""); // Can be set as Next.js cookie and passed into server side session/[id]/page.tsx

  const router = useRouter();
  
  useEffect(() => {
    // This effect will run only on the client side
    // You can place any client-side specific logic here
  }, []); // Empty dependency array ensures the effect runs only once on mount

  const [session, setSession] = useState("");
  const [formusername, setFormUsername] = useState("");
  const [formpassword, setFormPassword] = useState("");

  const handleSessionClick = (sid: any) => {
    setSession(sid);
    setFormUsername("");
    setFormPassword("");
  };

  const handleFormSubmit = (e: any) => {
    e.preventDefault();
    if(session !== formpassword){
      console.log("not the right password")
      setSession("");
      return
    }
    sessionStorage.setItem("username", formusername);
    //always set this to false because the form only applies to joining an existing session
    sessionStorage.setItem("isHost", "false");
    connectToSession(session, formusername, router);

    setSession("");
  };

  const [hoverSessionId, setHoverSessionId] = useState("");

  const handleMouseEnter = (event : any, sid : string) => {
    setHoverSessionId(sid); // displays the popup for that sid
  };

  const handleMouseLeave = () => {
    setHoverSessionId("");
  };

  return (
    <main className="background flex min-h-screen flex-col items-center justify-between p-24">
      <img src="GMJ-emblem-color.svg" alt="" />
      <div className="options">
        <div className="hostoptions">
          <h1>I'm a host:</h1>
          <form data-testid="host-form">
            <input type="text" placeholder='Username' maxLength={6} name="username" onChange={(e) => setUsername(e.target.value)} />
          </form>
          <button className="SubmitButton" onClick={() => {
            sessionStorage.setItem("username", username); // change this to a nextjs cookie (server-side)
            sessionStorage.setItem("isHost", "true"); // change this to a nextjs cookie (server-side)
            const client_id: string | undefined = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID; // Spotify developer client id for API calls
            const redirect_uri: string = 'http://localhost:3000/api/spotify/getToken'
            const scope: string = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
            handleSpotifyAuth(client_id, redirect_uri, scope);
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
            <input type="text" placeholder='Guest Code' maxLength={8} name="guestcode" onChange={(e) => setGuestCode(e.target.value.toUpperCase())} />
            <input type="text" placeholder='Username' maxLength={25} name="username" onChange={(e) => setUsername(e.target.value)} />
          </form>
          <button className="SubmitButton" onClick={() => {
            sessionStorage.setItem("username", username);
            sessionStorage.setItem("isHost", "true");
            connectToSession(guestCode, username, router) //stand in password until implemeneted
          }}>
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
      if (!response.ok) {
        return response.json().then((errorData) => {
            console.error("error:", errorData.message);
        })
      }

      return response.json();
    }).then((data) => {
      const url = data.url;
      router.push(url);
    })
  }
  catch (e) {
    // TODO: Add some error message to user saying that wrong code was entered
    console.error(e);
  }
}

