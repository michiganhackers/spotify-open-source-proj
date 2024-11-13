import React from 'react';

//maybe change this to not be a progress bar with seconds instead of percentages
function ProgressBar({ progress }: {progress : number}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

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

export default ProgressBar;