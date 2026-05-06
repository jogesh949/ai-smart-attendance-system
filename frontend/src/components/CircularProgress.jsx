import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const CircularProgress = ({ value, label, color = '#00F5FF', className = '' }) => {
  return (
    <div className={`w-32 h-32 ${className}`}>
      <CircularProgressbar
        value={value}
        text={`${Math.round(value)}%`}
        styles={buildStyles({
          rotation: 0.25,
          strokeLinecap: 'butt',
          textSize: '18px',
          pathTransitionDuration: 0.8,
          pathColor: color,
          textColor: '#F0F9FF',
          trailColor: 'rgba(255,255,255,0.1)',
          backgroundColor: 'transparent',
        })}
      />
    </div>
  );
};

export default CircularProgress;