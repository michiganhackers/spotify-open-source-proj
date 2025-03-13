'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleSpotifyAuth } from '@/src/utils';

const Toast: React.FC<{ message: string; onClose: () => void; }> = ({ message, onClose }) => {
  return (
    <div className="toast">
      {message}
      <button onClick={onClose}>×</button>
    </div>
  );
};

export default function Home() {
  const [guestCode, setGuestCode] = useState(""); 
  const [hostUsername, setHost] = useState(""); 
  const [guestUsername, setGuest] = useState("");
  const [toastMessage, setToastMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleHostSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent form submission behavior

    if (hostUsername === "") {
      setToastMessage("Error: Username is blank.");
      setHost('');
    } else {
      sessionStorage.setItem("username", hostUsername);
      sessionStorage.setItem("isHost", "true");

      const client_id: string | undefined = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
      const redirect_uri: string = `${process.env.NEXT_PUBLIC_APP_SERVER}/api/spotify/getToken`;
      const scope: string = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';

      handleSpotifyAuth(client_id, redirect_uri, scope);
    }
  };

  const handleGuestSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent form submission behavior
    sessionStorage.setItem("username", guestUsername);
    sessionStorage.setItem("isHost", "false");
    connectToSession(guestCode, guestUsername, router, setToastMessage, setGuestCode, setGuest);
  };

  return (
    <main className="background flex min-h-screen flex-col items-center justify-between p-24">
      <img src="GMJ-emblem-color.svg" alt="" className="logo" />
      <div className="options">

        {/* Host Section */}
        <div className="hostoptions">
          <h1>I'm a host:</h1>
          <form data-testid="host-form" onSubmit={handleHostSubmit}>
            <input
              type="text"
              placeholder="Username"
              maxLength={6}
              name="username"
              className="input-field"
              onChange={(e) => setHost(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleHostSubmit();
              }}
            />
          </form>
          <button className="SubmitButton" onClick={handleHostSubmit}>
            Host a Jam
          </button>
        </div>

        <div className="divideDiv">
          <hr className="divider" />
        </div>

        {/* Guest Section */}
        <div className="guestoptions">
          <h1>I'm a guest:</h1>
          <form data-testid="guest-form" onSubmit={handleGuestSubmit}>
            <input
              type="text"
              placeholder="Guest Code"
              maxLength={8}
              name="guestcode"
              value={guestCode}
              className="input-field"
              onChange={(e) => setGuestCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGuestSubmit();
              }}
            />
            <input
              type="text"
              placeholder="Username"
              maxLength={25}
              name="username"
              className="input-field"
              onChange={(e) => setGuest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGuestSubmit();
              }}
            />
          </form>
          <button className="SubmitButton" onClick={handleGuestSubmit}>
            Join
          </button>
        </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}
    </main>
  );
}

// Function to connect to a session
async function connectToSession(
  guestCode: string,
  username: string,
  router: any,
  setToastMessage: any,
  setGuestCode: any,
  setGuest: any
): Promise<void> {
  let stat;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/api/sessionDB/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guestCode: guestCode,
        username: username
      }),
    });

    if (!response.ok) {
      stat = response.status;
      throw new Error(response.statusText);
    }

    const data = await response.json();
    router.push(`/session/${guestCode}`); // Redirect to the correct session
  } catch (e) {
    if (stat === 401) {
      setToastMessage('Error: Guest code not found.');
      setGuestCode('');
    } else if (stat === 409) {
      setToastMessage('Error: Username already in use.');
      setGuest('');
    } else if (stat === 406) {
      setToastMessage('Error: Username is blank.');
      setGuest('');
    }
  }
}
