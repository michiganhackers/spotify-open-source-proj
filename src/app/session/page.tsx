import Image from "next/image";
import React, { useState, useEffect } from "react";

export function Song() {
  const [songName, setSongName] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [coverArtFile, setCoverArtFile] = useState("");
  const [artistName, setArtistName] = useState("");
  

  useEffect(() => {  }, []); // Empty dependency array ensures the effect runs only once on mount

  
  return (
    <div className="song">
      <img src={`${coverArtFile}`} alt="" />
      <p>{songName}</p>
      <p>{artistName}</p>
      <p>{addedBy}</p>
    </div>
  );
}



export function Queue() {
  const [songs, setSongs] = useState([]);

  useEffect(() => {  }, []); // Empty dependency array ensures the effect runs only once on mount

  
  return (
    <h1></h1>
  );
}


export default function Session() {
  const [guestCode, setGuestCode] = useState("");

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <p>Hello World!</p>
    </main>
  );
}



export function Sessionuest(){
  return(<>
      <div id="header">
        <button>Exit</button>
        <h1>Your Username</h1>
        <h1>Host of Session</h1>  
      </div>
      <div id = "AddSong">
        <form action="onSubmit">
          <input type="text" maxLength={6} name="guestcode" value={guestCode} onChange={(e) => setGuestCode(e.target.value.toUpperCase())}/>
        </form>
      </div>
      <div id ="Queue">
        <queue>
      </div>
    </>
  );
}
