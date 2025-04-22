'use client'
import { useEffect, useRef, useState } from 'react'
import 'dotenv/config'
import { AddSongToQueue } from '@/src/database/db'
import { getSocketInstance, removeSocketInstance } from '@/src/socket/SocketManager'
import { v4 as uuidv4 } from "uuid";
import { ProgressBar, millisecondsToString } from './progressbar';
import { getValue } from '@/src/utils';
import { EndSessionOverlay } from "@/src/app/session/[id]/EndSessionOverlay"
import { Socket } from 'socket.io-client'


const Toast: React.FC<{ message: string; onClose: () => void; }> = ({ message, onClose }) => {
  return (
    <div className="toast">
      {message}
      <button onClick={onClose}>×</button>
    </div>
  );
};


export function Session ({
    isHost, sid, username,
    hostName, clientNames, queue, router
} : {
    isHost : boolean, sid : string, username : string,
    hostName : string, clientNames : string[], queue : any[], router : any
}) {
    // Create a non-changing socket
    const userSessionId = useRef(uuidv4()); // unique identifier per user session
    const socket = getSocketInstance(sid, userSessionId.current, isHost);  

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

// A new component for the "now playing" layout
function NowPlayingCard({albumCover, trackTitle, artistName, progress, songlength, isPlaying, isHost, socket, onPlayPause, onSkip}: {
  albumCover?: string; trackTitle?: string, artistName?: string, progress: number, songlength: number, isPlaying: boolean, isHost : boolean, socket : any, onPlayPause: () => void, onSkip: () => void
}) {

  return (
    <div
      className="now-playing-card"
      style={{
        border: '5px solid purple',
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: '120px 1fr', // Explicit column sizes
        gridTemplateRows: 'auto auto auto', // Three rows
        columnGap: '20px',
        rowGap: '10px',
        alignItems: 'start',
        margin: '20px',
      }}
    >
      {/* Album Art - spans first 2 rows */}
      <div style={{ 
        width: '120px',
        height: '120px',
        overflow: 'hidden',
        gridRow: '1 / 3',
        backgroundColor: '#ccc' // Fallback if no image
      }}>
        {albumCover && (
          <img
            src={albumCover}
            alt="Album Art"
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}
      </div>

    {/* Track Title & Artist - row 1, column 2 */}
    <div style={{ 
        gridRow: 1,
        gridColumn: 2,
        textAlign: 'right'
    }}>
        <h2 style={{ margin: '0 0 4px 0' }}>
        {trackTitle || 'Track Title'}
        </h2>
        <p style={{ margin: 0 }}>
        {artistName || 'Artist'}
        </p>
    </div>

      {/* Progress Section - row 2, column 2 */}
      <div style={{ 
        gridRow: 2,
        gridColumn: 2,
        width: '100%'
      }}>
        <ProgressBar progress={progress} songlength={songlength} />
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px'
        }}>
          <span>{millisecondsToString(progress)}</span>
          <span>{millisecondsToString(songlength)}</span>
        </div>
        <p>Status: {isPlaying ? 'Playing' : 'Paused'}</p>
      </div>

    {/* Play/Pause Buttons - row 3, full width */}
    {isHost &&
        <div style={{ 
            gridRow: 3,
            gridColumn: '1 / -1', // Span all columns
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '15px'
        }}>
            <button onClick={onPlayPause}>
            {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button onClick={onSkip}>Skip</button>
        </div>
    }
    
    </div>
  );
}


// A simple Song component for the queue
export function Song(songProps: { id: string, name: string, addedBy?: string, coverArtURL: string, artistName: string, spotifyURL: string }) {
    const [songId, setSongId] = useState(songProps.id)
    const [songName, setSongName] = useState(songProps.name);
    const [addedBy, setAddedBy] = useState(songProps.addedBy);
    const [coverArtFile, setCoverArtFile] = useState(songProps.coverArtURL);
    const [artistName, setArtistName] = useState(songProps.artistName);
    const [spotifyURL, setSpotifyURL] = useState(songProps.spotifyURL)
  
    return (
    <div className="song">
      <div className="cover-art">
        <img src={coverArtFile} alt="" />
      </div>
      <div className="song-info">
        <div className="song-text">
          <div className="song-content">
            <p>{songName}</p>
            <p>{artistName}</p>
            { addedBy && <p>{addedBy}</p>}
          </div>
            <a href={spotifyURL} target="_blank" onClick={(e) => e.stopPropagation()}><img className="spotify-logo" src="../Spotify_Primary_Logo_RGB_Green.png" alt="Spotify logo"></img></a>
        </div>
      </div>
    </div>
  );
}

function Queue({isHost, initQueue, socket, username, sid
}: { isHost: boolean, initQueue: any[], socket: any,  username: string, sid: string}) {
    const [songList, setSongList] = useState<any[]>([]);
    const [songQuery, setSongQuery] = useState<any[]>([]);
    const [toastMessage, setToastMessage] = useState('');

    // For progress bar
    const [progress, setProgress] = useState(0);
    const [songlength, setSongLength] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Initialize queue from server
    useEffect(() => {
        for (let i = 0; i < initQueue.length; i++) { // Initialize starting queue from connection
        const songData = {
                songId: getValue(initQueue[i], 'songId'),
                songName: getValue(initQueue[i], 'songName'),
                albumCover: getValue(initQueue[i], 'albumCover'),
                artistName: getValue(initQueue[i], 'artistName'),
                placement: getValue(initQueue[i], 'placement'),
                spotifyURL: getValue(initQueue[i], 'spotifyURL')
            };

        setSongList((prevSongs) => [...prevSongs, songData]);
        }

        if(isHost) {
            socket.emit("AddedSong"); // This will force the websocket server to automatically update the queue when the host joins
        }
    }, [initQueue]);

    // Add song to end of the queue with all data needed for UI
    const addSongToQueue = (songInput: any) => {
        setSongList((prevSongs) => [...prevSongs, songInput]);
    };

    function addSongListener(songData : any) {
        addSongToQueue(songData); 
    }

    // Listen for queue updates from server
    socket.removeAllListeners("UpdateQueueUI");
    socket.on("UpdateQueueUI", (queue : any[]) => {
        
        const updatedQueue = queue.map((song, index) => ({
                songId: song.songId,
                songName: song.songName,
                albumCover: song.albumCover,
                artistName: song.artistName,
                placement: index,
                spotifyURL: song.spotifyURL
            }))

        setSongList([...updatedQueue]);
    });

    // Listen for progress updates
    socket.removeAllListeners("retrieveProgress");
    socket.on("retrieveProgress", (data: {is_playing : boolean, progress_ms : number, duration_ms : number, id : string}) => {
        //calc percentage of the bar can change later if need be ---------
        //const percentage = Math.round((data.progress_ms / data.duration_ms) * 100)
        console.log("seek, skip, or drift happened updating...");

        setIsPlaying(data.is_playing);
        setProgress(data.progress_ms)
        setSongLength(data.duration_ms);
    });


    // Basic timer to increment local progress while playing
    useEffect(() => {
        let intervalId: any;
        if (isPlaying) {
        intervalId = setInterval(() => {
            setProgress((prev) => {
            const newProgress = prev + 1000;
            if (newProgress >= songlength) {
                clearInterval(intervalId);
                return songlength;
            }
            return newProgress;
            });
        }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [isPlaying, songlength]);

    // Add a song to the server/queue
    const handleAddSong = (songId: string) => {
        fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/spotify/addSong`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            songId: songId,
            sid: sid,
            qlen: songList.length
        })
        })
        .then((response) => {
            if (!response.ok) throw Error(response.statusText);
            return response.json();
        })
        .then((data) => {
            // Add Websocket event to tell server to automatically update queue bc song was successfully received by Spotify API
            try {
                socket.emit('AddedSong');
            }
            catch (error) {
                console.error(error)
            }
            setToastMessage(` Successfully added: ${data.responseBody.songName}`);
            setTimeout(() => setToastMessage(''), 3000); // Auto hide after 3 seconds
        })
        .catch((error) => console.log(error));
    };

    // For searching songs
    const searchSongs = (input: string) => {
        setSongQuery([]);
        if (input === "") return;
        fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/spotify/searchSongs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songName: input, sid: sid })
        })
        .then((response) => {
            if (!response.ok) throw Error(response.statusText);
            return response.json();
        }).then((data) => {
            // Update the selection of songs based on search input
            let tmp: any[] = [];
            for (let i = 0; i < data.song_results.length; i++) {
                const songProps = {
                    songId: data.song_results[i].songId,
                    songName: data.song_results[i].songName,
                    user: username,
                    albumCover: data.song_results[i].albumCover,
                    artistName: data.song_results[i].artistName,
                    spotifyURL: data.song_results[i].spotifyURL
                };
                tmp[i] = songProps;
            }
            // Update UI component with new search data
            console.log(tmp)
            setSongQuery(tmp);
        }).catch((error) => console.log(error));
    };


    // Handlers for the “play/pause” and “skip” placeholders
    const handlePlayPause = () => {
        // Send request to toggle playback
        fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/spotify/playPause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sid: sid,
            state: !isPlaying
        })
        })
        .then(response => {
        if (!response.ok) {
            throw new Error('Failed to toggle playback');
        }
        return response.json();
        })
        .then(data => {
        // Update state based on actual server response
        setIsPlaying(data.is_playing);
        setProgress(data.progress_ms);
        setSongLength(data.duration_ms);
        })
        .catch(error => {
        console.error('Play/pause error:', error);
        // Optionally revert UI state
        setIsPlaying(prev => !prev);
        });
    };
        
    const handleSkip = () => {
        fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/spotify/skip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sid: sid })
        })
        .then(response => {
            if (!response.ok) throw new Error('Skip failed');
            socket.emit('AddedSong'); // Refresh queue
        })
        .catch(error => console.error('Skip error:', error));
    };
    
    useEffect(() => {
        const playbackUpdateHandler = (data: {
        is_playing: boolean;
        progress_ms: number;
        duration_ms: number;
        }) => {
        setIsPlaying(data.is_playing);
        setProgress(data.progress_ms);
        setSongLength(data.duration_ms);
        };
    
        socket.on('playbackUpdate', playbackUpdateHandler);
    
        return () => {
        socket.off('playbackUpdate', playbackUpdateHandler);
        };
    }, [socket]);
    

    // The first item is the "now playing" track
    const nowPlaying = songList.length > 0 ? songList[0] : null;
    // The rest of the queue
    const upcomingQueue = songList.slice(1);

    // A small debounce for searching
    let timer: any;
    const waitTime = 500;

  return (
    <>         

      {/* Now Playing Card */}
      {nowPlaying && (
        <NowPlayingCard
          albumCover={nowPlaying.albumCover}
          trackTitle={nowPlaying.songName}
          artistName={nowPlaying.artistName}
          progress={progress}
          songlength={songlength}
          isPlaying={isPlaying}
          isHost={isHost}
          socket={socket}
          onPlayPause={handlePlayPause}
          onSkip={handleSkip}
        />
      )}

      {/* The queue (excluding the first song) */}
      <div
        id="QueueWrapper"
        style={{
          maxHeight: '500px',
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
        }}
      >
        <h1 className="queue-header">Queue</h1>
        <div id="SongList">
          {upcomingQueue.map((song, index) => (
            <div key={`${song.songId}${song.placement}`}>
              <Song
                id={song.songId}
                name={song.songName}
                addedBy={song.user}
                coverArtURL={song.albumCover}
                artistName={song.artistName}
                spotifyURL={song.spotifyURL}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Search & Add songs */}
      <div
        id="QuerySongWrapper"
        style={{
          maxHeight: '500px',
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
        }}
      >
        <div id="AddSong">
          <input
            type="text"
            placeholder="Track Name"
            onKeyUp={(e: any) => {
              clearTimeout(timer);
              timer = setTimeout(() => {
                searchSongs(e.target.value);
              }, waitTime);
            }}
          />
        </div>

        <div id="dropdown" style={{ maxHeight: '600px', 
            overflowY: 'scroll', 
            overflowX: 'hidden',
            scrollbarWidth: 'none', 
            }}>
                {songQuery.map((song, index) => (
                <button onClick={() => {handleAddSong(song.songId)}} key={`${song.songId}${song.placement}`} className="lookup-song-button">
                    <Song 
                    id={song.songId}
                    name={song.songName}
                    coverArtURL={song.albumCover}
                    artistName={song.artistName}
                    spotifyURL={song.spotifyURL}
                    />
                </button>
                ))}
            </div>
        </div>
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
    </>
  );
}

// SessionGuest & SessionHost remain mostly the same, just swap out the old TitleCard usage
function SessionGuest({ hostName, clientNames, queue, username, socket, sid, router }: any) {
    const [isOverlayVisible, setOverlayVisible] = useState(false);

    const handleExit = () => {
        socket.disconnect();
        router.push('/');
    };

    socket.on("SessionEnded", () => {
        setOverlayVisible(true);
    });

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
            isHost={false}
            initQueue={queue}
            socket={socket}
            username={username}
            sid={sid}
            />
        </div>
        {
            isOverlayVisible ? 
            <>
            <EndSessionOverlay onReturnToHome={handleExit}/>
            </> 
            : <></>
        }
    </>
  );
}

function SessionHost({ hostName, clientNames, queue, username, socket, sid, router }: any) {
  socket.on("SessionEnded", () => {
    router.push('/');
  });

  const handleEndSession = () => {
    try {
      socket.emit("EndSession");
    } catch (error) {
      console.error("Failed to emit EndSession:", error);
    }
  };

  return (
    <>
      <div id="session-header">
        <h1 className="user-name">{username}</h1>
        <h1 className="guest-code">{sid}</h1>
        <button className="end-session-button" onClick={handleEndSession}>End Session</button>
      </div>
      <div id="session-body">
        <Queue
          isHost={true}
          initQueue={queue}
          socket={socket}
          username={username}
          sid={sid}
        />
      </div>
    </>
  );
}
