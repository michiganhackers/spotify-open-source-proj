import { NextResponse } from "next/server";

export async function GET() {
  const state = Math.random().toString(36).substring(2, 18);

  const response = NextResponse.json({ state });

  // Set cookie for the client
  response.cookies.set("spotify_auth_state", state, {
    maxAge: 3600,
    path: "/",
  });

  return response;
}
