'use client'
import React from "react";

export function EndSessionOverlay({ onReturnToHome }: { onReturnToHome: () => void }) {
  return (
    <div className="end-session-overlay">
      <div className="end-session-overlay-content">
        <p>Session has ended</p>
        <button onClick={onReturnToHome}>Return to Home</button>
      </div>
    </div>
  );
}

export default EndSessionOverlay;