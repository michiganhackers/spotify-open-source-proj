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
    //const [atoken, setAtoken] = useState("");

    let sid : string = params.id;

    useEffect(() => {
        if (typeof(window) !== 'undefined' && typeof(sessionStorage) !== 'undefined') {
            setIsHost(sessionStorage.getItem('isHost') || "");
            setUsername(sessionStorage.getItem('username') || "");
        }
    }, []);
    /*
    useEffect(() => {
 
        const getAccessToken = () => {
            //console.log("getting token");
          
            fetch('http://localhost:3000/api/spotify/getAccessToken', {
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
              .then((data: { accesstoken: string }) => {
                //console.log("access token:", data.accesstoken);
                if(atoken === ""){
                    setAtoken(data.accesstoken);
                }   
              })
              .catch((error) => {
                console.error("error:", error);
              });
          };
        
      getAccessToken();

      }, []);

      useEffect(() => {
          const getQueue = () => {
          
            fetch('http://localhost:3000/api/spotify/getQueue', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ accessToken: atoken }), 
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error(response.statusText);
                }
                return response.json();
              })
              .then((data) => {
                //console.log("Queue data:", data.queue);
               
                setQueue(data.queue);
                  
              })
              .catch((error) => {
                console.error("Error:", error);
              });
          };

          if(atoken){
            getQueue();
          }
        
      }, [atoken]);
      */

      useEffect(() => {
 
        const mountQueue = () => {
            //console.log("getting token");
          
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
                //console.log("access token:", data.accesstoken);
                console.log("data: ", data);
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

