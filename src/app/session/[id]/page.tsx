'use client'
import React, { useState, useEffect } from "react";
import { Session } from './client'
import 'dotenv/config'


export default function SessionPage({ params } : { params: { id: string} }) {
    // To make this a server-side component, we can receive each of the below variables as next cookies
    const [isHost, setIsHost] = useState("");
    const [username, setUsername] = useState("");
    const [hostName, setHostName] = useState("");
    const [clientNames, setClientNames] = useState([]);
    const [queue, setQueue] = useState([]);
    const [isHostNameSet, setIsHostNameSet] = useState(false);
    
    let sid : string = params.id;

    useEffect(() => {
        // Add host's name to DB now that session has been created
        if(sessionStorage.getItem('isHost') === "true") {
            fetch('/api/sessionDB/addHostName', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: sessionStorage.getItem('username'),
                    sid: sid
                })
            })
            .then((response) => {
                if(!response.ok) throw new Error(`${response.status} ${response.statusText}`)
                
                // Wait until host name has been set before setting isHost and username properties
                setIsHost(sessionStorage.getItem('isHost') || "");
                setUsername(sessionStorage.getItem('username') || "");
                setIsHostNameSet(true); // Allow next useEffect access to call initSession now that host name is set
                return response.json()
            })
            .catch((error) => console.log(error))
        }
        else{
            // This functionality below should be encompassed by initSession, including the clientNames and current queue state as well
            fetch(`/api/sessionDB/getHostName?session_id=${params.id}`, {
                method: "GET", 
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then((response) => {
                console.log(response);
                if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
                return response.json();
            })
            .then((data) => {
                console.log(data.hostname);
                setHostName(data.hostname);
            })
            .catch((error) => {
                console.error("Error:", error);
            });

            // If user is not Host, we know the host's id must have already been set
            setIsHostNameSet(true);
        }
    }, []);

      useEffect(() => {
        const mountQueue = () => {
            fetch('http://localhost:3000/api/spotify/mountQueue', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ sid }),
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error(response.statusText);
                }
                return response.json();
              })
              .then((data) => {
                console.log("queue: ", data.queue);
                setQueue(data.queue);
              })
              .catch((error) => {
                console.error("error:", error);
              });
          };
        
        mountQueue();

      }, []);

    return (
        <main id="session-main" className="background flex min-h-screen flex-col items-center justify-between p-24">
            <Session
                isHost={isHost}
                sid={sid}
                username={username}
                hostName={hostName}
                clientNames={clientNames}
                queue={queue}
            >      
            </Session>
        </main>  
    )
}

