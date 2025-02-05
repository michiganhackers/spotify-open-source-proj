'use client'
import { useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client';
import { socketIO } from '@/src/socket/client'
import 'dotenv/config'
import { AddSongToQueue } from '@/src/database/db'
import { getSocketInstance, removeSocketInstance } from '@/src/socket/SocketManager'
import { v4 as uuidv4 } from "uuid";
import { ProgressBar, millisecondsToString } from './progressbar';
import { getValue } from '@/src/utils';

const Toast: React.FC<{ message: string; onClose: () => void; }> = ({ message, onClose }) => {
  return (
    <div className="toast">
      {message}
      <button onClick={onClose}>×</button>
    </div>
  );
};

export function Session({
  isHost, sid, username,
  hostName, clientNames, queue, router
}: {
  isHost: boolean, sid: string, username: string,
  hostName: string, clientNames: string[], queue: any[], router: any
}) {

  // Create a non-changing socket
  const userSessionId = useRef(uuidv4()); // unique identifier per user session
  const socket = getSocketInstance(sid, userSessionId.current, isHost).connect();

  if (isHost)
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

export function Song(songProps: { id: string, name: string, addedBy?: string, coverArtURL: string, artistName: string }) {
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

function Queue({ isHost, initQueue, socket, username, sid }: { isHost: boolean, initQueue: any[], socket: any, username: string, sid: string }) {
  const [songInput, setSongInput] = useState("");
  const [songList, setSongList] = useState<any[]>([]);
  const [songQuery, setSongQuery] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [songlength, setSongLength] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // ADDED: useRef for debounce timer
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isHost) {
      socket.emit("AddedSong");
    }

    // Keep your original initialization logic
    for (let i = 0; i < initQueue.length; i++) {
      const songData = {
        songId: getValue(initQueue[i], 'songId'),
        songName: getValue(initQueue[i], 'songName'),
        albumCover: getValue(initQueue[i], 'albumCover'),
        artistName: getValue(initQueue[i], 'artistName'),
        placement: getValue(initQueue[i], 'placement'),
      };
      setSongList((prevSongs) => [...prevSongs, songData]);
    }
  }, [initQueue]);

  // Keep all your original socket listeners
  socket.removeAllListeners("UpdateQueueUI");
  socket.on("UpdateQueueUI", (queue: any[]) => {
    const updatedQueue = queue.map((song, index) => ({
      songId: song.songId,
      songName: song.songName,
      albumCover: song.albumCover,
      artistName: song.artistName,
      placement: index
    }));
    setSongList([...updatedQueue]);
  });

  socket.removeAllListeners("retrieveProgress");
  socket.on("retrieveProgress", (data: { is_playing: boolean, progress_ms: number, duration_ms: number, id: string }) => {
    console.log("seek, skip, or drift happened updating...");
    setIsPlaying(data.is_playing);
    setProgress(data.progress_ms);
    setSongLength(data.duration_ms);
  });

  useEffect(() => {
    let intervalId: any;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 1000;
          return newProgress >= songlength ? songlength : newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, songlength]);

  const handleAddSong = (songId: string) => {
    fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/spotify/addSong`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songId: songId,
        sid: sid,
        qlen: songList.length
      })
    }).then((response) => {
      if (!response.ok) throw Error(response.statusText);
      return response.json();
    }).then((data) => {
      // Keep your original socket emission
      try {
        socket.emit('AddedSong');
      }
      catch (error) {
        console.error(error);
      }

      // RESET LOGIC (EXISTING IN YOUR CODE)
      setSongInput("");
      setSongQuery([]);

      setToastMessage(` Successfully added: ${data.responseBody.songName}`);
      setTimeout(() => setToastMessage(''), 3000);
    }).catch((error) => console.log(error));
  };

  const searchSongs = (input: string) => {
    setSongQuery([]);
    if (input === "") return;

    fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/spotify/searchSongs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songName: input,
        sid: sid,
      })
    }).then((response) => {
      if (!response.ok) throw Error(response.statusText);
      return response.json();
    }).then((data) => {
      // Keep your original array population
      let tmp: any[] = [];
      for (let i = 0; i < data.song_results.length; i++) {
        const songProps = {
          songId: data.song_results[i].songId,
          songName: data.song_results[i].songName,
          user: username,
          albumCover: data.song_results[i].albumCover,
          artistName: data.song_results[i].artistName,
        };
        tmp[i] = songProps;
      }
      setSongQuery(tmp);
    }).catch((error) => console.log(error));
  };

  // ADDED: Proper input handling
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSongInput(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => searchSongs(value), 500);
  };

  return (
    <>
      {/* Keep all your original styling */}
      <div style={{ padding: '20px', color: 'rgb(166, 238, 166)' }}>
        <h2>Song Progress Bar</h2>
        <ProgressBar progress={progress} songlength={songlength} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <p>{millisecondsToString(progress)}</p>
          <p>{millisecondsToString(songlength)}</p>
        </div>
        <p>Status: {isPlaying ? 'Playing' : 'Paused'}</p>
      </div>

      <div id="QueueWrapper" style={{
        maxHeight: '500px',
        overflowY: 'scroll',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
      }}>
        <h1>Queue</h1>
        <div id="SongList">
          {songList.map((song) => (
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

      {/* MODIFIED: Added controlled input and proper event handling */}
      <div id="QuerySongWrapper" style={{
        maxHeight: '500px',
        overflowY: 'scroll',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
      }}>
        <div id="AddSong">
          <input
            type="text"
            placeholder='Track Name'
            value={songInput} // Added controlled value
            onChange={handleSearchInput} // Changed to controlled input
          />
        </div>

        <div id="dropdown" style={{
          maxHeight: '600px',
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
        }}>
          {songQuery.map((song, index) => (
            <button onClick={() => handleAddSong(song.songId)} key={index} className="lookup-song-button">
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

// Keep your original SessionGuest and SessionHost components unchanged
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
  socket.on("SessionEnded", () => { router.push('/') });

  const handleEndSession = () => {
    try {
      socket.emit("EndSession");
    }
    catch (error) {
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