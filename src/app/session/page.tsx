import { TemplateContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";
import React, { useState, useEffect } from "react";


export function Song({ url }: { url: string }) {
  const [songName, setSongName] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [coverArtFile, setCoverArtFile] = useState("");
  const [artistName, setArtistName] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    let ignoreStaleRequest = false;
    fetch(url, { credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) throw Error(response.statusText);
        return response.json();
      })
      .then((data) => {
        if (!ignoreStaleRequest) {
          setSongName(data.name);
          setAddedBy(data.user);
          setCoverArtFile(data.coverArtFile);
          setArtistName(data.artist);
        }
        setLoadingStatus(false);
      })
      .catch((error) => console.log(error));

    return () => {
      ignoreStaleRequest = true;
    };
  }, [url]);

  return (
    <div className="song">
      <img src={`${coverArtFile}`} alt="" />
      <p>{songName}</p>
      <p>{artistName}</p>
      <p>{addedBy}</p>
    </div>
  );
}

interface QueueProps {
  songName: string;
  onSongAdded: (song: string) => void;
}

function Queue(){
  // Function body
  const [songInput, setSongInput] = useState("");
  const [songList, setSongList] = useState<string[]>([]);

  // Add song to end of the queue (eventually should store song url)
  const addSongToQueue = (songInput: string) => {
    setSongList((prevSongs) => [...prevSongs, songInput]);
  };

  // Handles song submission then clears input
  const handleAddSong = () => {
    // TODO: Make this a fetch of the song's url instead of adding directly
    // fetch(songInput, { credentials: "same-origin" })
    // .then((response) => {
    //   if (!response.ok) throw Error(response.statusText);
    //   return response.json();
    // })
    // .then((data) => {
    //   addSongToQueue(data);  
    // })
    // .catch((error) => console.log(error));
    addSongToQueue(songInput);
    setSongInput("");
  };

  // Can be used to have song "suggestions" for similar song names later
  const searchSongs = (input: string) => {
    let temp = [];
    // Requests all similar song names
    // fetch(songInput, { credentials: "same-origin" })
    // .then((response) => {
    //   if (!response.ok) throw Error(response.statusText);
    //   return response.json();
    // })
    // .then((data) => {
    //   temp = data;
    //   /*implement way to display options*/
    // })
    // .catch((error) => console.log(error));
    setSongInput(input);
  }

  return (
    <div>
      <h1>Queue</h1>
      {songList.map((song, index) => (
        <div key={index}>
          <Song url={song}/>
        </div>
      ))}
      <div id="AddSong">
        <input
          type="text"
          value={songInput}
          onChange={(e) => searchSongs(e.target.value)}
        />
        <button onClick={handleAddSong}>Add</button>
      </div>
    </div>
  );
}


// SessionGuest component is now the source of truth for the queue of songs
function SessionGuest() {
  return (
    <>
      <div id="header">
        <button>Exit</button>
        <h1>Your Username</h1>
        <h1>Host of Session</h1>
      </div>
      <div id="QueueInterface">
        <Queue/>  
      </div>
    </>
  );
}
