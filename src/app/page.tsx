import Image from "next/image";
import { useState }  from 'react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <p>Welcome to [insert name here]</p>

      <div>
        <div>
            <button>I'm a host</button>
            </div>
        <div>
            <button>I'm a guest</button>
        </div>
      </div>
    </main>
  );
}
