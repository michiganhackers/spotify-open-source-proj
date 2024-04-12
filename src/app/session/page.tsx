'use client'
import { TemplateContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Socket } from "socket.io";
import { io } from "socket.io-client";


const SERVER = "localhost:8080";
const socket = io(SERVER, {
    auth: {   
        token: sessionStorage.getItem("sid")
    }
}); // Initialize the client-side websocket


var hostName : any, clientNames : any, queue : any;
    socket.on("initSession", (data) => {
        // Populate UI with initial session state
        hostName = data.hostName;
        clientNames = data.clientNames;
        queue = data.queue;
})

export default function Session() {

    const [isHost, setHost] = useState(sessionStorage.getItem("isHost") === "true" ? true : false);

    if(isHost)
        return <SessionHost 
            hostName={hostName}
            clientNames={clientNames}
            queue={queue}  
        />;
    else
        return <SessionGuest 
            hostName={hostName}
            clientNames={clientNames}
            queue={queue}
        />;
}

export function Song(songProps : {name: string, user : string, coverArtURL : string, artistName : string}) {
  const [songName, setSongName] = useState(songProps.name);
  const [addedBy, setAddedBy] = useState(songProps.user);
  const [coverArtFile, setCoverArtFile] = useState(songProps.coverArtURL);
  const [artistName, setArtistName] = useState(songProps.artistName);
  // const [loadingStatus, setLoadingStatus] = useState(true);

/*  useEffect(() => {
    let ignoreStaleRequest = false;
    // Might need to change below fetch to server run to use access token
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
  }, [url]); */

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

function Queue(queue : any){
  // Function body
  const [songInput, setSongInput] = useState("");
  const [songList, setSongList] = useState<any[]>([]);
  const [songQuery, setSongQuery] = useState<any[]>([]);

  for(let i = 0; i < queue.length; i++) { // Initialize starting queue from connection
     setSongList((prevSongs) => [...prevSongs, queue[i]]);
  }

  socket.on("addSongToUI", (songData) => {
    // Add new song to queue in UI for all others who did not update it
    addSongToQueue(songData);
});

  // Add song to end of the queue with all data needed for UI
  const addSongToQueue = (songInput: any) => {
    setSongList((prevSongs) => [...prevSongs, songInput]);
  };

  // Handles song submission then clears input
  const handleAddSong = (songToBeAdded : string) => {
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
    fetch('api/spotify/addSong', { // Adds song to the database
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: "https://api.spotify.com/v1/tracks/"+songToBeAdded,
            sid: sessionStorage.getItem("sid"),
            addedBy: sessionStorage.getItem("username"),
            qlen: songList.length
        })
    }).then((response) => {
        if (!response.ok) throw Error(response.statusText);
        return response.json();
    }).then((data) => {
        // Update the UI of all other clients
        const songData = {  sid: sessionStorage.getItem("sid"),
                            songName: data.songName,
                            albumCover: data.albumCover,
                            artistName: data.artistName, 
                            placement: data.placement, 
                            addedBy: data.addedBy
                        }
        socket.emit("sendSongToSocket", songData)
    }).catch((error) => console.log(error))

    addSongToQueue(songInput);
    setSongInput("");
  };

  // Can be used to have song "suggestions" for similar song names later
  const searchSongs = (input: string) => {
    
    if(input === ""){
      return;
    }
    setSongQuery([]);
    // Requests all similar song names
    fetch('api/spotify/searchSongs', { // Adds song to the database
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          songName: input,
          sid: sessionStorage.getItem("sid"),
     })
    }).then((response) => {
        if (!response.ok) throw Error(response.statusText);
        return response.json();
    }).then((data) => {
        // Update the UI of all other clients
        const songs = Object.keys(data).map((key) => {
          const songProps = {  
            name: data[key].songName,
            user: "",
            coverArtURL: data[key].albumCover,
            artistName: data[key].artistName,
          };
          return <form onSubmit={(e) => {e.preventDefault(); addSongToQueue(data[key].songId);} }>
                  <button type="submit"><Song key={key} {...songProps}/></button>;
                 </form>
        });
        setSongQuery(prevSongQuery => prevSongQuery.concat(songs));
    }).catch((error) => console.log(error))
  }

  return (
    <div>
      <h1>Queue</h1>
      {songList.map((song, index) => (
        <div key={index}>
          <Song 
            name={song.songName}
            user={song.user}
            coverArtURL={song.albumCover}
            artistName={song.artistName}
          />
        </div>
      ))}
      <div id="AddSong">
        <input
          type="text"
          value={songInput}
          onChange={(e) => searchSongs(e.target.value)}
        />
        <div id="dropdown">
          {songQuery.map((song, index) => (
          <div key={index}>
            <Song 
              name={song.songName}
              user={""}
              coverArtURL={song.albumCover}
              artistName={song.artistName}
            />
          </div>
        ))}
        </div>
      </div>
      
    </div>
  );
}


// SessionGuest component is now the source of truth for the queue of songs
function SessionGuest( {hostName, clientNames, queue } : any ) {
  return (
    <>
      <div id="header">
        <button>Exit</button>
        <h1>${sessionStorage.getItem('username')}</h1>
        <h1>${hostName}</h1>
      </div>
      <div id="QueueInterface">
        <Queue
            queue={queue}
        />  
      </div>
    </>
  );
}


// TODO: Add host components where necessary
function SessionHost({hostName, clientNames, queue } : any) {
    return (
      <>
        <div id="header">
          <button>End Session</button>
          <h1>Host Username</h1>
        </div>
        <div id="QueueInterface">
          <Queue
            queue={queue}
          />  
        </div>
      </>
    );
  }
