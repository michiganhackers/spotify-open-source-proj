import React from 'react';

//maybe change this to not be a progress bar with seconds instead of percentages
export function ProgressBar({ progress, songlength }: {progress : number, songlength : number}) {

  const percentage = Math.round((progress / songlength) * 100)

  const clampedProgress = Math.min(100, Math.max(0, percentage));

  return (
    <div style={styles.progressBarContainer}>
      <div
        style={{
          ...styles.progressBarFill,
          width: `${clampedProgress}%`,
        }}
      />
    </div>
  );
}

const styles = {
  progressBarContainer: {
    width: '100%',
    height: '20px',
    backgroundColor: '#e0e0de',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.2s ease-in-out',
  },
};

export function millisecondsToString(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedSeconds = seconds.toString().padStart(2, '0');

  return `${minutes}:${formattedSeconds}`;
}