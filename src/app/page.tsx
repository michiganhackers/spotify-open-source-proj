'use client'
import Image from "next/image";
import { useState, useEffect } from 'react';


export default function Home() {
  const [guestCode, setGuestCode] = useState("");
  
  useEffect(() => {
    // This effect will run only on the client side
    // You can place any client-side specific logic here
  }, []); // Empty dependency array ensures the effect runs only once on mount

  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <p>Welcome to [insert name here]</p>
      <img src="GMJ-emblem-color.svg" alt="" />
      <div className="options">
        <div className="hostoptions">
            <h1>I'm a host:</h1>
            <button className="SubmitButton"> Host </button>
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
