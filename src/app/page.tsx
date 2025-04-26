'use client'
import { stringify } from 'querystring';
import { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation'
import { Router } from 'next/router';
import { handleSpotifyAuth } from '@/src/utils';
import 'dotenv/config';
const Toast: React.FC<{ message: string; onClose: () => void; }> = ({ message, onClose }) => {
  return (
    <div className="toast">
      {message}
      <button onClick={onClose}>×</button>
    </div>
  );
};
 

export default function Home() {
  const [guestCode, setGuestCode] = useState(""); // Can be set as Next.js cookie and passed into server side session/[id]/page.tsx
  const [hostUsername, setHost] = useState(""); // Can be set as Next.js cookie and passed into server side session/[id]/page.tsx
  const [guestUsername, setGuest] = useState("");
  const [toastMessage, setToastMessage] = useState('');
  const router = useRouter();

  
  
  useEffect(() => {
    // This effect will run only on the client side
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3500);
      return () => clearTimeout(timer);}
    // You can place any client-side specific logic here
  }, [toastMessage]); // Empty dependency array ensures the effect runs only once on mount
  return (
    <main className="background flex min-h-screen flex-col items-center justify-around p-16">
      <img src="GMJ-emblem-color.svg" className="homeImg" alt="" />
      <div className="options font-poppins">
        <div className="hostoptions">
            <h1>I'm a host:</h1>
            <form data-testid="host-form">
                <input className="w-4/5" type="text" placeholder='Username' maxLength={6} name="username" onChange={(e) => setHost(e.target.value)}/>
            </form>
            <button className="SubmitButton w-4/5 mx-auto" onClick={() => {
              if(hostUsername == ""){
                setToastMessage('Error: Username is blank.');
                setHost('');
              } else {
                sessionStorage.setItem("username", hostUsername); // change this to a nextjs cookie (server-side)
                sessionStorage.setItem("isHost", "true"); // change this to a nextjs cookie (server-side)
                const client_id : string | undefined = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID; // Spotify developer client id for API calls
                const redirect_uri : string = `${process.env.NEXT_PUBLIC_APP_SERVER}/api/spotify/getToken`
                const scope : string = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
                handleSpotifyAuth(client_id, redirect_uri, scope); }
                }}>
                Host a Jam
            </button>
        </div>
        <div className="divideDiv">
          <hr className="divider w-1/1"></hr>
        </div>

        <div className="guestoptions">
            <h1>I'm a guest:</h1>
            <form data-testid="guest-form">
                <input className="w-4/5" type="text" placeholder='Guest Code' maxLength={8} name="guestcode" value={guestCode}   onChange={(e) => setGuestCode(e.target.value.toUpperCase())}/>
                <input className="w-4/5" type="text" placeholder='Username' maxLength={25} name="username" onChange={(e) => setGuest(e.target.value)}/>
            </form>
            <button className="SubmitButton w-4/5 mx-auto" onClick={() => {
                sessionStorage.setItem("username", guestUsername);
                // console.log(guestUsername);
                sessionStorage.setItem("isHost", "false");
                   connectToSession(guestCode, guestUsername, router,setToastMessage,setGuestCode, setGuest)}}>

                    Join
            </button>
        </div>
      </div>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}
    </main>
  );
}

async function connectToSession(guestCode : string, username : string, router : any, setToastMessage : any, setGuestCode: any,  // Add this setter function to clear guestCode
  setGuest: any) : Promise<void> { 
   // Add this setter function to clear guestCode
  
 let stat; 
  try {
    
    await fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/sessionDB/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guestCode: guestCode,
        username: username
      }),
    }).then((response) => {
        if(!response.ok){
          stat = response.status;
            throw Error(response.statusText);}

      return response.json();
    }).then((data) => {
      const url = data.url;
      router.push(url);
    })
  }
  catch(e){
    if(stat == 401){
    console.error(e);
    setToastMessage('Error: Guest code not found.');
    setGuestCode('');
   }else if (stat == 409){
    setToastMessage('Error: Username already in use.');
    setGuest('');
   } else if (stat == 406) {
    setToastMessage('Error: Username is blank.');
    setGuest('');
   }
  
  }
}

