import React, { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, ArrowLeft } from 'lucide-react';

export default function TimerMode({ settings }) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // For countdown: starts from timerDuration. For stopwatch: starts from 0.
  const initialTime = settings.timerType === 'countdown' ? settings.timerDuration : 0;
  const [currentTime, setCurrentTime] = useState(initialTime);

  // Reset when settings change
  useEffect(() => {
    resetTimer();
  }, [settings]);

  const resetTimer = () => {
    setIsPlaying(false);
    setCurrentTime(settings.timerType === 'countdown' ? settings.timerDuration : 0);
  };

  useEffect(() => {
    let timerId;
    if (isPlaying) {
      timerId = setInterval(() => {
        setCurrentTime(prev => {
          if (settings.timerType === 'countdown') {
            if (prev <= 1) {
              setIsPlaying(false);
              return 0; // Finished
            }
            return prev - 1;
          } else {
            // Stopwatch
            return prev + 1;
          }
        });
      }, 1000);
    }

    return () => clearInterval(timerId);
  }, [isPlaying, settings.timerType]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!isPlaying && settings.timerType === 'countdown' && currentTime === 0) {
      // Don't start countdown if it's already 0
      return;
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="timer-mode-container">
      <div className="full-timer-text">
        {formatTime(currentTime)}
      </div>
      
      <div className="timer-controls">
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <><Square fill="currentColor" size={24} /> 停止</>
          ) : (
            <><Play fill="currentColor" size={24} /> スタート</>
          )}
        </button>
        <button 
          className="btn" 
          style={{ backgroundColor: '#95a5a6', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}
          onClick={resetTimer}
        >
          <RotateCcw size={24} /> リセット
        </button>
      </div>

      {settings.progressDisplayType === 'visual' && settings.timerType === 'countdown' && (
        <div style={{ marginTop: '40px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', width: '80%', height: '100px' }}>
          {Array.from({ length: 10 }).map((_, i) => {
            const threshold = settings.timerDuration - (settings.timerDuration / 10) * (i + 1);
            const isFilled = currentTime > threshold;
            return (
              <div 
                key={i} 
                style={{
                  flex: '1 1 0', minWidth: '20px', maxWidth: '8vh', height: '100%', 
                  backgroundColor: isFilled ? settings.boxColor : 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  transition: 'background-color 0.5s'
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
