import { cookies } from 'next/headers'
import { NextResponse } from 'next/server';


export async function POST(req: Request) {
    const cookieStore = cookies();

    const data = await req.json();
    const key = data.key;
    const value = data.value;

    cookieStore.set(key, value)

    return NextResponse.json(
        {
            status: 201
        }
    )
}


