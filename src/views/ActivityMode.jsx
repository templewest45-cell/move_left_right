import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';

export default function ActivityMode({ settings }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentDirection, setCurrentDirection] = useState(null); // 'left' or 'right'
  const [remainingCount, setRemainingCount] = useState(settings.totalCount);
  const [remainingTime, setRemainingTime] = useState(settings.totalTime);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastDirection, setLastDirection] = useState(null); // Used for 'alternating'
  const [intervalCountdown, setIntervalCountdown] = useState(settings.intervalTime);
  const countdownRef = useRef(settings.intervalTime);
  const advanceDeckRef = useRef([]);
  const audioCtxRef = useRef(null);
  const bgmAudioRef = useRef(null);

  const playWhistle = useCallback(() => {
    if (!settings.playSE) return;
    try {
      if (!audioCtxRef.current) {
         audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const now = ctx.currentTime;
      const duration = 0.15;
      const volMultiplier = (settings.seVolume !== undefined ? settings.seVolume : 50) / 100;
      
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4 * volMultiplier, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01 * volMultiplier, now + duration);

      // Two oscillators slightly out of tune for the "trill" effect
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(2000, now);
      osc1.frequency.linearRampToValueAtTime(2400, now + 0.1);
      osc1.frequency.linearRampToValueAtTime(2200, now + duration);
      osc1.connect(gainNode);
      
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(2050, now);
      osc2.frequency.linearRampToValueAtTime(2450, now + 0.1);
      osc2.frequency.linearRampToValueAtTime(2250, now + duration);
      osc2.connect(gainNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
      
    } catch (e) {
      console.error("Audio error", e);
    }
  }, [settings.playSE]);

  const playEndWhistle = useCallback(() => {
    if (!settings.playSE) return;
    try {
      if (!audioCtxRef.current) {
         audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const now = ctx.currentTime;
      const volMultiplier = (settings.seVolume !== undefined ? settings.seVolume : 50) / 100;
      
      const playOnePip = (startTime, duration) => {
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4 * volMultiplier, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01 * volMultiplier, startTime + duration);

        const osc1 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(2000, startTime);
        osc1.frequency.linearRampToValueAtTime(2400, startTime + 0.1);
        osc1.frequency.linearRampToValueAtTime(2200, startTime + duration);
        osc1.connect(gainNode);
        
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2050, startTime);
        osc2.frequency.linearRampToValueAtTime(2450, startTime + 0.1);
        osc2.frequency.linearRampToValueAtTime(2250, startTime + duration);
        osc2.connect(gainNode);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + duration);
        osc2.stop(startTime + duration);
      };
      
      // 「ピ・ピーー」という終了の合図
      playOnePip(now, 0.15);
      playOnePip(now + 0.25, 0.8);
      
    } catch (e) {
      console.error("Audio error", e);
    }
  }, [settings.playSE]);

  // Handle BGM playback
  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = (settings.bgmVolume !== undefined ? settings.bgmVolume : 50) / 100;
      if (isPlaying && !isFinished) {
        bgmAudioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        bgmAudioRef.current.pause();
        bgmAudioRef.current.currentTime = 0;
      }
    }
  }, [isPlaying, isFinished, settings.bgmType, settings.bgmUrl, settings.bgmVolume]);

  // Handle End Condition Sound
  useEffect(() => {
    if (isFinished) {
      playEndWhistle();
    }
  }, [isFinished, playEndWhistle]);

  // Reset state when settings change
  useEffect(() => {
    resetActivity();
  }, [settings]);

  const resetActivity = useCallback(() => {
    setIsPlaying(false);
    setIsFinished(false);
    setCurrentDirection(null);
    setRemainingCount(settings.totalCount);
    setRemainingTime(settings.totalTime);
    setElapsedTime(0);
    setLastDirection(null);
    setIntervalCountdown(settings.intervalTime);
    countdownRef.current = settings.intervalTime;
    advanceDeckRef.current = [];
  }, [settings]);

  const getAdvanceDirections = useCallback(() => {
    const type = settings.advanceDirectionType || 'all';
    if (type === 'orthogonal') return ['up', 'down', 'left', 'right'];
    if (type === 'diagonal') return ['up-left', 'up-right', 'down-left', 'down-right'];
    return ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'];
  }, [settings.advanceDirectionType]);

  const getNextDirection = useCallback(() => {
    const isAdvance = settings.appMode === 'advance';

    if (settings.sequence === 'alternating') {
      if (isAdvance) {
        let order = ['up', 'up-right', 'right', 'down-right', 'down', 'down-left', 'left', 'up-left'];
        if (settings.advanceDirectionType === 'diagonal') {
          order = ['up-right', 'down-right', 'down-left', 'up-left'];
        } else if (settings.advanceDirectionType === 'orthogonal') {
          order = ['up', 'right', 'down', 'left'];
        }
        
        if (!lastDirection || !order.includes(lastDirection)) {
          setLastDirection(order[0]);
          return order[0];
        }
        const nextIndex = (order.indexOf(lastDirection) + 1) % order.length;
        const nextDir = order[nextIndex];
        setLastDirection(nextDir);
        return nextDir;
      } else {
        const nextDir = lastDirection === 'left' ? 'right' : 'left';
        setLastDirection(nextDir);
        return nextDir;
      }
    } else {
      // random
      if (isAdvance) {
        if (advanceDeckRef.current.length === 0) {
          const dirs = getAdvanceDirections();
          advanceDeckRef.current = [...dirs].sort(() => Math.random() - 0.5);
        }
        return advanceDeckRef.current.pop();
      } else {
        return Math.random() > 0.5 ? 'left' : 'right';
      }
    }
  }, [settings.sequence, settings.appMode, lastDirection, getAdvanceDirections]);

  const handleManualDirection = (dir) => {
    setCurrentDirection(dir);
    playWhistle();
    if (settings.appMode !== 'advance' && settings.endCondition === 'count') {
      setRemainingCount(prev => {
        if (prev <= 1) {
          setIsFinished(true);
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }
  };

  // Main Activity Loop
  useEffect(() => {
    let intervalTickId;
    let timerId;

    if (isPlaying && !isFinished) {
      // 1. Initial display if none
      if (!currentDirection) {
        if (settings.sequence === 'analog') {
          if (settings.appMode === 'advance') {
            setCurrentDirection(getAdvanceDirections()[0]);
          } else {
            setCurrentDirection('left');
          }
          playWhistle();
        } else {
          setCurrentDirection(getNextDirection());
          playWhistle();
          countdownRef.current = settings.intervalTime;
          setIntervalCountdown(settings.intervalTime);
        }
      }

      // 2. Setup Direction Switching Interval
      if (settings.sequence !== 'analog') {
        intervalTickId = setInterval(() => {
          if (countdownRef.current <= 1) {
            // 時間が来たら切り替えと副作用を実行
            setCurrentDirection(getNextDirection());
            playWhistle();
            
            if (settings.appMode !== 'advance' && settings.endCondition === 'count') {
              setRemainingCount(rc => {
                if (rc <= 1) {
                  setIsFinished(true);
                  setIsPlaying(false);
                  return 0;
                }
                return rc - 1;
              });
            }
            countdownRef.current = settings.intervalTime;
            setIntervalCountdown(settings.intervalTime);
          } else {
            countdownRef.current -= 1;
            setIntervalCountdown(countdownRef.current);
          }
        }, 1000);
      }

      // 3. Setup Time Countdown & Elapsed Time
      timerId = setInterval(() => {
        if (settings.appMode === 'advance') {
          setElapsedTime(prev => prev + 1);
        } else if (settings.endCondition === 'time') {
          setRemainingTime(prev => {
            if (prev <= 1) {
              setIsFinished(true);
              setIsPlaying(false);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      clearInterval(intervalTickId);
      clearInterval(timerId);
    };
  }, [isPlaying, isFinished, settings, currentDirection, getNextDirection]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderDirectionDisplay = () => {
    if (!currentDirection || !isPlaying) {
      if (isFinished) {
        return <div className="direction-display" style={{ fontSize: '15vmin' }}>おわり！</div>;
      }
      return (
        <button 
          className="btn" 
          style={{ fontSize: '3rem', padding: '20px 50px', backgroundColor: 'var(--secondary-color)', color: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}
          onClick={() => setIsPlaying(true)}
        >
          <Play size={60} fill="currentColor" /> はじめる
        </button>
      );
    }

    // Map logic
    const contentMap = {
      hiragana: { left: 'ひだり', right: 'みぎ' },
      katakana: { left: 'ヒダリ', right: 'ミギ' },
      kanji: { left: '左', right: '右' },
      arrow: { left: '←', right: '→' }
    };

    if (settings.appMode === 'advance') {
      const advanceMap = {
        up: '↑', down: '↓', left: '←', right: '→',
        'up-left': '↖', 'up-right': '↗', 'down-left': '↙', 'down-right': '↘'
      };
      return (
        <div key={currentDirection + remainingCount + remainingTime} className="direction-display">
          {advanceMap[currentDirection]}
        </div>
      );
    }

    if (settings.cueType === 'color') {
      return (
        <div 
          key={currentDirection + remainingCount + remainingTime} // Force re-animation
          className="color-block"
          style={{ backgroundColor: currentDirection === 'left' ? settings.colorLeft : settings.colorRight }} 
        />
      );
    }

    return (
      <div 
        key={currentDirection + remainingCount + remainingTime} // Force re-animation
        className="direction-display"
      >
        {contentMap[settings.cueType][currentDirection]}
      </div>
    );
  };

  return (
    <>
      <div className="top-area">
        {isPlaying && (
          <button 
            className="btn"
            style={{ position: 'absolute', left: '2vw', display: 'flex', alignItems: 'center', gap: '10px' }}
            onClick={() => {
              setIsPlaying(false);
              if (settings.appMode === 'advance') {
                setIsFinished(true);
              }
            }}
          >
            <Square fill="currentColor" size={24} /> {settings.appMode === 'advance' ? 'おわり' : '停止'}
          </button>
        )}
        {(isFinished || (!isPlaying && currentDirection)) && (
          <button 
            className="btn"
            style={{ position: 'absolute', left: '2vw', display: 'flex', alignItems: 'center', gap: '10px' }}
            onClick={resetActivity}
          >
            <RotateCcw size={24} /> リセット
          </button>
        )}
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <div className="timer-text">
             {(() => {
                 if (settings.appMode === 'advance') {
                   return '矢印をよく見て動こう';
                 }
                 const titleMap = {
                   kanji: '左右に動こう',
                   hiragana: 'さゆうにうごこう',
                   arrow: '←→にうごこう',
                   color: 'いろをよくみてうごこう',
                   katakana: 'サユウニウゴコウ'
                 };
                 return titleMap[settings.cueType] || '左右移動';
             })()}
          </div>
        </div>
      </div>

      <div className="center-area" style={{ flexDirection: 'column' }}>
        {renderDirectionDisplay()}
        {isPlaying && !isFinished && settings.sequence !== 'analog' && currentDirection && (
          <div style={{ fontSize: '6vmin', fontWeight: 'bold', color: 'white', marginTop: '2vmin', textShadow: '2px 2px 0px rgba(0,0,0,0.3)', fontVariantNumeric: 'tabular-nums' }}>
            つぎまで: {intervalCountdown}
          </div>
        )}
      </div>

      <div className="bottom-area" style={{ backgroundColor: settings.bgBottomColor }}>
        {settings.appMode === 'advance' ? (
          <div className="remaining-text" style={{ fontSize: '10vmin', fontVariantNumeric: 'tabular-nums' }}>
            かかった時間: {formatTime(elapsedTime)}
          </div>
        ) : settings.progressDisplayType === 'visual' ? (
          <div style={{ width: '100%', height: '100%', padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {settings.endCondition === 'count' ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', height: '100%', alignItems: 'center' }}>
                {Array.from({ length: settings.totalCount }).map((_, i) => (
                  <div 
                    key={i} 
                    style={{
                      flex: '1 1 0', minWidth: '10px', maxWidth: '8vh', height: '80%', 
                      backgroundColor: i < remainingCount ? settings.boxColor : 'rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      transition: 'background-color 0.3s'
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', height: '100%', alignItems: 'center' }}>
                {Array.from({ length: 10 }).map((_, i) => {
                  const threshold = settings.totalTime - (settings.totalTime / 10) * (i + 1);
                  const isFilled = remainingTime > threshold;
                  return (
                    <div 
                      key={i} 
                      style={{
                        flex: '1 1 0', minWidth: '10px', maxWidth: '8vh', height: '80%', 
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
        ) : (
          <div className="remaining-text">
            {settings.endCondition === 'count' ? (
              <span>のこり: {remainingCount} 回</span>
            ) : (
              <span>のこり時間: {formatTime(remainingTime)}</span>
            )}
          </div>
        )}
      </div>

      {settings.sequence === 'analog' && isPlaying && !isFinished && (
        <div 
          className="teacher-controller" 
          style={{
            position: 'absolute', 
            bottom: '2vh', 
            right: '2vw', 
            backgroundColor: 'rgba(0,0,0,0.6)', 
            padding: '10px', 
            borderRadius: '10px', 
            zIndex: 100
          }}
        >
          {settings.appMode === 'advance' ? (
            (() => {
              const activeDirs = getAdvanceDirections();
              const renderBtn = (dir, label) => {
                const isActive = activeDirs.includes(dir);
                return (
                  <button 
                    className="btn" 
                    style={{ 
                      padding: '15px', 
                      fontSize: '2rem', 
                      backgroundColor: isActive ? '#333' : 'transparent', 
                      color: isActive ? 'white' : 'transparent',
                      pointerEvents: isActive ? 'auto' : 'none',
                      border: isActive ? '' : 'none'
                    }} 
                    onClick={() => handleManualDirection(dir)}
                  >
                    {label}
                  </button>
                );
              };
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                  {renderBtn('up-left', '↖')}
                  {renderBtn('up', '↑')}
                  {renderBtn('up-right', '↗')}
                  
                  {renderBtn('left', '←')}
                  <div style={{ padding: '15px' }}></div>
                  {renderBtn('right', '→')}
                  
                  {renderBtn('down-left', '↙')}
                  {renderBtn('down', '↓')}
                  {renderBtn('down-right', '↘')}
                </div>
              );
            })()
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn" 
                style={{ fontSize: '1.2rem', padding: '10px 20px', backgroundColor: '#333', color: 'white', borderRadius: '8px' }}
                onClick={() => handleManualDirection('left')}
              >
                左を表示
              </button>
              <button 
                className="btn" 
                style={{ fontSize: '1.2rem', padding: '10px 20px', backgroundColor: '#333', color: 'white', borderRadius: '8px' }}
                onClick={() => handleManualDirection('right')}
              >
                右を表示
              </button>
            </div>
          )}
        </div>
      )}

      {/* BGM Audio Player */}
      {(settings.bgmType === 'tengoku' || (settings.bgmType === 'custom' && settings.bgmUrl)) && (
        <audio 
          ref={bgmAudioRef}
          src={settings.bgmType === 'tengoku' ? '/tengoku.mp3' : settings.bgmUrl} 
          loop 
          style={{ display: 'none' }}
        />
      )}
    </>
  );
}
