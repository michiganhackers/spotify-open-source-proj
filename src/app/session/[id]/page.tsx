'use client'
import { TemplateContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { socketIO } from '@/src/socket/client'
import { Session } from './client';
import 'dotenv/config'

export default function SessionPage({ params } : { params: { id: string} }) {
    const [isHost, setIsHost] = useState(false);
    const [username, setUsername] = useState("");
    //const [hostName, setHostName] = useState("");
    //const [clientNames, setClientNames] = useState([])
    //const [queue, setQueue] = useState([])
    //const [loadInit, setLoadInit] = useState(false)
    
    let sid : string = params.id;
    useEffect(() => {
        if (typeof(window) !== 'undefined' && typeof(sessionStorage) !== 'undefined') {
            setIsHost(sessionStorage.getItem('isHost') === "true");
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
    
    
    return <Session 
        isHost={isHost}
        sid={sid}
        username={username}
        hostName={hostName}
        clientNames={clientNames}
        queue={queue}
    />
}

