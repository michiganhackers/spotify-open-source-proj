
import { TemplateContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { cookies } from 'next/headers'
import { socketIO } from '@/src/socket/client'
import { Session } from './client'
import 'dotenv/config'

export default function SessionPage() {
    
    const cookieStore = cookies();
    const socket = socketIO(String(cookieStore.get('sid')))
    
    var hostName : any, clientNames : any, queue : any;
    socket.on("initSession", (data) => {
        // Populate UI with initial session state
        hostName = data.hostName;
        clientNames = data.clientNames;
        queue = data.queue;
    });

    return <Session 
        isHost={String(cookieStore.get('isHost')) == 'true' ? true : false}
        sid={String(cookieStore.get('sid'))}
        username={String(cookieStore.get('username'))}
        hostName={hostName}
        clientNames={clientNames}
        queue={queue}
    />
}

