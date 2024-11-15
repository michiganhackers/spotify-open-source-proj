import { updateTokens } from "@/src/socket/refreshTokens";
import { NextResponse } from "next/server";

//THIS IS AN INSANELY ROUGH IMPLEMENTATION NEED TO GO OVER THIS ON THURSDAY

//have this run on error!!!

// REQUIRES: req contains the sid of the session that wants a refreshed accesstoken
export async function POST(req: Request) {
    const reqData = await req.json();
    const sid : string = reqData.sid;  

    await updateTokens(sid)
    console.log("ran")

    return NextResponse.json(
        { message: "yes" },
        { status : 200 }
    )
}