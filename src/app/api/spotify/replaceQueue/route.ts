import { NextRequest, NextResponse } from 'next/server';
import { ReplaceQueue } from '@/src/database/db';  // Adjust the path if necessary

// Handle POST request
export async function POST(request: NextRequest) {
  try {
    const { sid, songList } = await request.json();

    console.log("recieved", { sid, songList });

    await ReplaceQueue(sid, songList);  // Call your ReplaceQueue function here

    console.log("replaced queue");
    return NextResponse.json({ message: 'replaced queue' }, { status: 200 });
  } catch (error) {
    console.error("Error in ReplaceQueue:", error);
    return NextResponse.json({ error: 'did not replace queue' }, { status: 500 });
  }
}
