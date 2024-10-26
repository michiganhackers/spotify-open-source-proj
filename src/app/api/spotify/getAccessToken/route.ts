import { NextRequest, NextResponse } from 'next/server';
import { GetAccessToken } from '@/src/database/db';  // Adjust the path if necessary

// Handle POST request
export async function POST(request: NextRequest, response: NextResponse) {
  try {
    const { sid } = await request.json();

    console.log("recieved", { sid});

    const accesstoken = await GetAccessToken(sid);  // Call your ReplaceQueue function here

    console.log("acruied access token: ", accesstoken);
    return NextResponse.json({ accesstoken });
  } catch (error) {
    console.error("Error in getaccesstoken:", error);
    return NextResponse.json({ error: 'did not get access token' }, { status: 500 });
  }
}
