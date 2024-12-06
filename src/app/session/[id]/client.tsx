'use client'
import { useEffect, useState } from 'react'
import { socketIO } from '@/src/socket/client'
import 'dotenv/config'
import { AddSongToQueue } from '@/src/database/db'
import { render } from 'react-dom'

export function Session({
    isHost, sid, username,
    hostName, clientNames, queue, router
} : {
    isHost : boolean, sid : string, username : string,
    hostName : string, clientNames : string[], queue : any[], router : any
}) {

    const socket = socketIO(sid);
    socket.connect(); // connect to ws

    if(isHost)
        return <SessionHost 
            hostName={hostName}
            clientNames={clientNames}
            queue={queue} 
            username={username}
            socket={socket}
            sid={sid} 
            router={router}
        />;
    else
        return <SessionGuest 
            hostName={hostName}
            clientNames={clientNames}
            queue={queue}
            username={username}
            socket={socket}
            sid={sid}
            router={router}
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

  /*useEffect(() => {
    console.log(songList);
    console.log("Updated songList");
  }, [songList]) */
  
  // Initialize starting queue from connection
  /*for(let i = 0; i < initQueue.length; i++) { // Initialize starting queue from connection
    const songData = 
        {  
            songId: initQueue[i].song_id,
            songName: initQueue[i].song_name,
            albumCover: initQueue[i].album_cover,
            artistName: initQueue[i].artist_name, 
            placement: initQueue[i].placement,
        }
    setSongList((prevSongs) => [...prevSongs, songData]);
 }*/

    // Add song to end of the queue with all data needed for UI
    const addSongToQueue = (songInput: any) => {
        setSongList((prevSongs) => [...prevSongs, songInput]);
    };

    function addSongListener(songData : any) {
        addSongToQueue(songData); 
    }

    socket.removeAllListeners("UpdateQueueUI");
    socket.on("UpdateQueueUI", (queue : any[]) => {
        console.log("Received UpdateQueueUI emission")
        console.log(socket)
        
    const updatedQueue = queue.map((song, index) => ({
            songId: song.songId,
            songName: song.songName,
            albumCover: song.albumCover,
            artistName: song.artistName,
            placement: index
        }))

    console.log(updatedQueue);
    setSongList([...updatedQueue]);
  });

    // Handles song submission then clears input
    const handleAddSong = (songId : string) => {
   
        fetch('http://localhost:3000/api/spotify/addSong', { // Adds song to the spotify queue
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
            };
            // Add Websocket event to tell server to automatically update queue bc song was successfully received by Spotify API
            console.log(socket)
            try {
                socket.emit('AddedSong');
            }
            catch (error) {
                console.error(error)
            }
            setToastMessage(` Successfully added: ${data.responseBody.songName}`);
            setTimeout(() => setToastMessage(''), 3000); // Auto hide after 3 seconds
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
      {songList.map((song) => (
        <div key={song.songId}>
          <Song 
            id={song.songId}
            name={song.songName}
            addedBy={song.user}
            coverArtURL={song.albumCover}
            artistName={song.artistName}
          />

                </div>
            ))}
        
        </div>
        
        <div id="QuerySongWrapper">
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
function SessionGuest( {hostName, clientNames, queue, username, socket, sid, router } : any ) {

    const [isOverlayVisible, setOverlayVisible] = useState(false);

    const handleExit = () => {        
        // Send disconnect event to WSS
        socket.disconnect();
        // Re-route to the home page (from inside the newly created overlay component)
        router.push('/');
    };


    socket.on("SessionEnded", () => {
        setOverlayVisible(true); // Show overlay
    })

  return (
    <>
      <div id="session-header">
        <h1 className="user-name">{username}</h1>
        <div className="session-header-middle">
          <h1 className="session-header-host">{hostName}'s Session</h1>
          <h1 className="session-header-guest-code">{sid}</h1>
        </div>
        <button className="end-session-button" onClick={handleExit}>Exit</button>
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
function SessionHost({hostName, clientNames, queue, username, socket, sid, router } : any) {

    // Once socket sends back "SessionEnded" event, route back to home page
    socket.on("SessionEnded", () => {router.push('/')})

    const handleEndSession = () => {
        // Send socket event to server to shut down session
        try {
            socket.emit("EndSession");
        }
        catch (error) {
            console.error("Failed to emit EndSession:", error);
        }
    }

    return (
        <>
        <div id="session-header">
          <h1 className="user-name">{username}</h1>
          <h1 className="guest-code">{sid}</h1>         
          <button className="end-session-button" onClick={handleEndSession}>End Session</button>
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
