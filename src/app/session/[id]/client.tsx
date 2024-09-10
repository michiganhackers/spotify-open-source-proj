'use client'
import { useEffect, useState } from 'react'
import { socketIO } from '@/src/socket/client'
import 'dotenv/config'
import { AddSongToQueue } from '@/src/database/db'

export function Session({
    isHost, sid, username,
    hostName, clientNames, queue
} : {
    isHost : string, sid : string, username : string,
    hostName : string, clientNames : string[], queue : any[]
}) {

    const socket = socketIO(sid);

    if(isHost === "true")
        return <SessionHost 
            hostName={hostName}
            clientNames={clientNames}
            queue={queue} 
            username={username}
            socket={socket}
            sid={sid} 
        />;
    else
        return <SessionGuest 
            hostName={hostName}
            clientNames={clientNames}
            queue={queue}
            username={username}
            socket={socket}
            sid={sid}
        />;
}


export function Song(songProps : {id: string, name: string, addedBy? : string, coverArtURL : string, artistName : string}) {
  const [songId, setSongId] = useState(songProps.id)
  const [songName, setSongName] = useState(songProps.name);
  const [addedBy, setAddedBy] = useState(songProps.addedBy);
  const [coverArtFile, setCoverArtFile] = useState(songProps.coverArtURL);
  const [artistName, setArtistName] = useState(songProps.artistName);

  return (
    <div className="song">
      <div className="cover-art">
        <img src={coverArtFile} alt="" />
      </div>
      <div className="song-info">
        <p>{songName}</p>
        <p>{artistName}</p>
        <p>{addedBy}</p>
      </div>
      
    </div>
  );
}


interface QueueProps {
  songName: string;
  onSongAdded: (song: string) => void;
}


function Queue({ initQueue, socket, username, sid } : { initQueue : any[], socket : any, username : string, sid : string}) {
  // Function body
  const [songInput, setSongInput] = useState("");
  const [songList, setSongList] = useState<any[]>([]);
  const [songQuery, setSongQuery] = useState<any[]>([]);

  socket.connect(); // connect to ws
  
  // Initialize starting queue from connection
  for(let i = 0; i < initQueue.length; i++) { // Initialize starting queue from connection
    const songData = 
        {  
            songId: initQueue[i].song_id,
            songName: initQueue[i].song_name,
            albumCover: initQueue[i].album_cover,
            artistName: initQueue[i].artist_name, 
            placement: initQueue[i].placement,
        }
    setSongList((prevSongs) => [...prevSongs, songData]);
 }

  // Add song to end of the queue with all data needed for UI
  const addSongToQueue = (songInput: any) => {
    setSongList((prevSongs) => [...prevSongs, songInput]);
  };

  function addSongListener(songData : any) {
    // socket.off("addSongToUI", addSongListener); 
    //console.log(songData)
    addSongToQueue(songData); 
  }

  socket.removeAllListeners("UpdateQueueUI");
  socket.on("UpdateQueueUI", (queue : any[]) => {
    console.log("Received UpdateQueueUI emission")
    console.log(queue)
      
   const updatedQueue = queue.map((song) => ({
        songId: song.songId,
        songName: song.songName,
        albumCover: song.albumCover,
        artistName: song.artistName
    }))

    setSongList(updatedQueue);
  });

  // Handles song submission then clears input
  const handleAddSong = (songId : string) => {
   
    fetch('http://localhost:3000/api/spotify/addSong', { // Adds song to the database
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            songId: songId,
            sid: sid,
            qlen: songList.length
        })
    }).then((response) => {
        if (!response.ok) throw Error(response.statusText);
        return response.json();
    }).then((data) => {
        const songData = 
        {  
            songId: songId,
            songName: data.responseBody.songName,
            albumCover: data.responseBody.albumCover,
            artistName: data.responseBody.artistName, 
            placement: data.responseBody.placement,
        }
        // GOAL: Update UI of all other clients
        // ACTION: Talk to WSS using designated event
        // socket.emit("sendSongToSocket", songData)
        // addSongToQueue(songData);
    }).catch((error) => console.log(error))

  };

  // Can be used to have song "suggestions" for similar song names later
  const searchSongs = (input: string) => {
    
    setSongQuery([]);
    if(input === ""){
        return;
    }
    // Requests all similar song names
    fetch('http://localhost:3000/api/spotify/searchSongs', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          songName: input,
          sid: sid,
     })
    }).then((response) => {
        if (!response.ok) throw Error(response.statusText);
        return response.json();
    }).then((data) => {
        // Update the selection of songs based on search input
        let tmp : any[] = [];
        for(let i = 0; i < data.song_results.length; i++) {
            const songProps = {
                songId: data.song_results[i].songId,  
                songName: data.song_results[i].songName,
                user: username,
                albumCover: data.song_results[i].albumCover,
                artistName: data.song_results[i].artistName,
                };
            tmp[i] = songProps;
        }
        // Update UI component with new search data
        setSongQuery(tmp);
    }).catch((error) => console.log(error))
  }

  let timer : any;
  const waitTime = 500;

  return (
    <div id="QueueWrapper">
      <h1>Queue</h1>
      {songList.map((song, index) => (
        <div key={index}>
          <Song 
            id={song.songId}
            name={song.songName}
            addedBy={song.user}
            coverArtURL={song.albumCover}
            artistName={song.artistName}
          />

        </div>
      ))}
      <div id="AddSong">
        <input
          type="text"
          placeholder='Track Name'
          onKeyUp={(e : any) => {
            clearTimeout(timer);

            timer = setTimeout(() => {
                searchSongs(e.target.value)
            }, waitTime);
          }
        }
        />
        <div id="dropdown">
          {songQuery.map((song, index) => (
          <button onClick={() => {handleAddSong(song.songId)}} key={index} className="lookup-song-button">
            <Song 
              id={song.songId}
              name={song.songName}
              coverArtURL={song.albumCover}
              artistName={song.artistName}
            />
          </button>
        ))}
        </div>
      </div>
      
    </div>
  );
}


// SessionGuest component is now the source of truth for the queue of songs
export function SessionGuest( {hostName, clientNames, queue, username, socket, sid } : any ) {
  return (
    <>
      <div id="session-header">
        <button>Exit</button>
        <h1>{username}</h1>
        <h1>Host: {hostName}</h1>
        <h1>Guest Code: {sid}</h1>
      </div>
      <div id="session-body">
        <Queue
        initQueue={queue}
        socket={socket}
        username={username}
        sid={sid}
        />  
      </div>
        
    </>
  );
}


// TODO: Add host components where necessary
export function SessionHost({hostName, clientNames, queue, username, socket, sid } : any) {
    return (
        <>
        <div id="session-header">
          <button>End Session</button>
          <h1>{username}</h1>
          <h1>Guest Code: {sid}</h1>
        </div>
        <div id="session-body">
          <Queue
            initQueue={queue}
            socket={socket}
            username={username}
            sid={sid}
          />  
        </div>
        </>
    );
  }
