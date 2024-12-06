/* API Endpoint for deleting data specific to a session */

import { DeleteSession } from "@/src/database/db";
import { NextResponse } from "next/server";

// REQUIRES: sid is passed inside of request body
export async function POST(req: Request) {
    
    const data = await req.json();
    const sid : string | null = data.sid;

    if(sid === null) {
        return NextResponse.json(
            { message: "Missing sid in body (Bad Request)" },
            { status: 400 }
        )
    }

    try {
        await DeleteSession(sid); 
    }
    catch (e : any) {
        return NextResponse.json(
            { message: e.message },
            { status: 404 }
        )
    }
    
}