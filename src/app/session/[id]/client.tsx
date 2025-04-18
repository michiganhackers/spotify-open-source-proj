'use client'
import { useEffect, useRef, useState } from 'react'
import 'dotenv/config'
import { getValue } from '@/src/utils'
import { v4 as uuidv4 } from 'uuid'
import { getSocketInstance } from '@/src/socket/SocketManager'

// Reuse your existing ProgressBar & time formatting utilities
export function ProgressBar({ progress, songlength }: { progress: number, songlength: number }) {
  // Safely handle 0-length
  const percent = songlength > 0 ? (progress / songlength) * 100 : 0;
  return (
    <div style={{ background: '#888', width: '100%', height: '8px', borderRadius: '4px' }}>
      <div
        style={{
          background: '#4caf50',
          width: `${percent}%`,
          height: '8px',
          borderRadius: '4px'
        }}
      />
    </div>
  );
}

export function millisecondsToString(ms: number) {
  if (!ms) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

const Toast: React.FC<{ message: string; onClose: () => void; }> = ({ message, onClose }) => {
  return (
    <div className="toast">
      {message}
      <button onClick={onClose}>×</button>
    </div>
  );
};

// A new component for the "now playing" layout
function NowPlayingCard({
  albumCover,
  trackTitle,
  artistName,
  progress,
  songlength,
  isPlaying,
  onPlayPause,
  onSkip
}: {
  albumCover?: string;
  trackTitle?: string;
  artistName?: string;
  progress: number;
  songlength: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkip: () => void;
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
      </div>

      {/* Play/Pause Buttons - row 3, full width */}
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
    </div>
  );
}



// A simple Song component for the queue
export function Song({
  id,
  name,
  addedBy,
  coverArtURL,
  artistName
}: {
  id: string;
  name: string;
  addedBy?: string;
  coverArtURL: string;
  artistName: string;
}) {
  return (
    <div className="song">
      <div className="cover-art">
        <img src={coverArtURL} alt="" />
      </div>
      <div className="song-info">
        <p>{name}</p>
        <p>{artistName}</p>
        {addedBy && <p>{addedBy}</p>}
      </div>
    </div>
  );
}

function Queue({
  isHost,
  initQueue,
  socket,
  username,
  sid
}: {
  isHost: boolean;
  initQueue: any[];
  socket: any;
  username: string;
  sid: string;
}) {
  const [songList, setSongList] = useState<any[]>([]);
  const [songQuery, setSongQuery] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  // For progress bar
  const [progress, setProgress] = useState(0);
  const [songlength, setSongLength] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize queue from server
  useEffect(() => {
    if (isHost) {
      // Force server to update queue on host join
      socket.emit("AddedSong");
    }
    // Load initial queue
    for (let i = 0; i < initQueue.length; i++) {
      const songData = {
        songId: getValue(initQueue[i], 'songId'),
        songName: getValue(initQueue[i], 'songName'),
        albumCover: getValue(initQueue[i], 'albumCover'),
        artistName: getValue(initQueue[i], 'artistName'),
        placement: getValue(initQueue[i], 'placement'),
      };
      setSongList((prev) => [...prev, songData]);
    }
  }, [initQueue, isHost, socket]);

  // Listen for queue updates from server
  useEffect(() => {
    socket.removeAllListeners("UpdateQueueUI");
    socket.on("UpdateQueueUI", (queue: any[]) => {
      const updatedQueue = queue.map((song, index) => ({
        songId: song.songId,
        songName: song.songName,
        albumCover: song.albumCover,
        artistName: song.artistName,
        placement: index
      }));
      setSongList(updatedQueue);
    });

    // Listen for progress updates
    socket.removeAllListeners("retrieveProgress");
    socket.on("retrieveProgress", (data: {
      is_playing: boolean,
      progress_ms: number,
      duration_ms: number,
      id: string
    }) => {
      setIsPlaying(data.is_playing);
      setProgress(data.progress_ms);
      setSongLength(data.duration_ms);
    });
  }, [socket]);

  // Basic timer to increment local progress while playing
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let syncInterval: NodeJS.Timeout;
  
    const updateProgress = () => {
      setProgress(prev => {
        const newProgress = prev + 500;
        return newProgress >= songlength ? songlength : newProgress;
      });
    };
  
    if (isPlaying) {
      intervalId = setInterval(updateProgress, 500);
      
      // Add periodic server sync
      syncInterval = setInterval(() => {
        fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/spotify/state?sid=${sid}`)
          .then(res => res.json())
          .then(data => {
            setIsPlaying(data.is_playing);
            setProgress(data.progress_ms);
            setSongLength(data.duration_ms);
          });
      }, 1000);
    }
  
    return () => {
      clearInterval(intervalId);
      clearInterval(syncInterval);
    };
  }, [isPlaying, songlength, sid]);
  

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
        socket.emit('AddedSong'); // Let everyone know the queue changed
        setToastMessage(`Successfully added: ${data.responseBody.songName}`);
        setTimeout(() => setToastMessage(''), 3000);
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
      })
      .then((data) => {
        const tmp: any[] = [];
        for (let i = 0; i < data.song_results.length; i++) {
          tmp.push({
            songId: data.song_results[i].songId,
            songName: data.song_results[i].songName,
            user: username,
            albumCover: data.song_results[i].albumCover,
            artistName: data.song_results[i].artistName,
          });
        }
        setSongQuery(tmp);
      })
      .catch((error) => console.log(error));
  };

  // A small debounce for searching
  let timer: any;
  const waitTime = 500;

  // Handlers for the “play/pause” and “skip” placeholders
  const handlePlayPause = () => {
    const newState = !isPlaying;
    
    // Send request to toggle playback with the correct parameter name
    fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/spotify/playPause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sid: sid,
        state: newState  // Changed from isPlaying to state
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
      // Revert UI state if there was an error
      setIsPlaying(!newState);
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
        <h1>Queue</h1>
        <div id="SongList">
          {upcomingQueue.map((song) => (
            <div key={`${song.songId}${song.placement}`}>
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

        <div
          id="dropdown"
          style={{
            maxHeight: '600px',
            overflowY: 'scroll',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
          }}
        >
          {songQuery.map((song, index) => (
            <button
              onClick={() => handleAddSong(song.songId)}
              key={index}
              className="lookup-song-button"
            >
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

export function Session({
  isHost,
  sid,
  username,
  hostName,
  clientNames,
  queue,
  router
}: {
  isHost: boolean;
  sid: string;
  username: string;
  hostName: string;
  clientNames: string[];
  queue: any[];
  router: any;
}) {
  // Create a non-changing socket
  const userSessionId = useRef(uuidv4());
  const socket = getSocketInstance(sid, userSessionId.current, isHost).connect();

  if (isHost) {
    return (
      <SessionHost
        hostName={hostName}
        clientNames={clientNames}
        queue={queue}
        username={username}
        socket={socket}
        sid={sid}
        router={router}
      />
    );
  } else {
    return (
      <SessionGuest
        hostName={hostName}
        clientNames={clientNames}
        queue={queue}
        username={username}
        socket={socket}
        sid={sid}
        router={router}
      />
    );
  }
}
