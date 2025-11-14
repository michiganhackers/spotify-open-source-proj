import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const code = reqUrl.searchParams.get("code");
  const state = reqUrl.searchParams.get("state");

  if (!code) throw new Error("Authentication failed.");

  const cookieStore = cookies();
  const storedState = cookieStore.get("spotify_auth_state")?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  // Clear cookie after verification
  cookieStore.set("spotify_auth_state", "", { maxAge: 0, path: "/" });

  const basic = btoa(`${client_id}:${client_secret}`);
  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      code,
      redirect_uri: `${process.env.APP_SERVER}/api/spotify/getToken`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) throw new Error(tokenResponse.statusText);
  const data = await tokenResponse.json();

  const createResponse = await fetch(`${process.env.APP_SERVER}/api/sessionDB/create`, {
    method: "POST",
    body: JSON.stringify({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expires_in: data.expires_in,
    }),
  });

  const createData = await createResponse.json();
  const sid = createData.sid;

  return NextResponse.redirect(new URL(`/session/${sid}`, process.env.APP_SERVER));
}
