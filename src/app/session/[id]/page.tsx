'use client'
import React, { useState, useEffect } from "react";
import { Session } from './client'
import 'dotenv/config'

export default function SessionPage({ params } : { params: { id: string} }) {
    const [isHost, setIsHost] = useState("");
    const [username, setUsername] = useState("");
    
    let sid : string = params.id;

    useEffect(() => {
        if (typeof(window) !== 'undefined' && typeof(sessionStorage) !== 'undefined') {
            setIsHost(sessionStorage.getItem('isHost') || "");
            setUsername(sessionStorage.getItem('username') || "");
        }
    }, []);
   

    var hostName : string = "";
    var clientNames : string[] = [];
    var queue : any[] = [];

    useEffect(() => {
        fetch('http://localhost:3000/api/sessionDB/initSession', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sid: sid,
        }),
        }).then((response) => {
            if(!response.ok)
                return new Error(response.statusText);

            return response.json();
        }).then((sessionData) => {
            hostName = sessionData.hostName;
            clientNames = sessionData.clientNames;
            queue = sessionData.queue;
        })
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