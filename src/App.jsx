import React, { useState } from 'react';
import ActivityMode from './views/ActivityMode';
import TimerMode from './views/TimerMode';
import TopMenu from './views/TopMenu';
import SettingsModal from './components/SettingsModal';
import { Settings, Home } from 'lucide-react';

function App() {
  const [currentScreen, setCurrentScreen] = useState('menu'); // 'menu' | 'app'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    appMode: 'activity', // 'activity' | 'advance' | 'timer'
    
    // Activity Settings
    cueType: 'hiragana', // 'hiragana' | 'katakana' | 'kanji' | 'arrow' | 'color'
    sequence: 'random', // 'random' | 'alternating'
    endCondition: 'count', // 'count' | 'time'
    totalCount: 10,
    totalTime: 60, // seconds
    intervalTime: 3, // seconds between cues
    colorLeft: '#e74c3c', // Red
    colorRight: '#3498db', // Blue
    progressDisplayType: 'visual', // 'text' | 'visual'
    bgMainColor: '#ff9800', // Orange
    bgBottomColor: '#4a90e2', // Blue
    boxColor: '#ffffff', // White
    playSE: true, // Play beep sound
    seVolume: 50, // 0 to 100
    bgmType: 'tengoku', // 'none' | 'tengoku' | 'custom'
    bgmVolume: 50, // 0 to 100
    advanceDirectionType: 'all', // 'all' | 'orthogonal' | 'diagonal'
    bgmUrl: null, // Custom BGM
    bgmName: '', // Custom BGM Name
    usePoseDetection: false, // カメラ動き検出（MediaPipe Pose）
    
    // Timer Settings
    timerType: 'countdown', // 'countdown' | 'stopwatch'
    timerDuration: 60, // seconds
  });

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    setIsSettingsOpen(false);
  };

  const handleSelectMode = (mode) => {
    setSettings(prev => ({ ...prev, appMode: mode }));
    setCurrentScreen('app');
  };

  if (currentScreen === 'menu') {
    return (
      <>
        <TopMenu onSelectMode={handleSelectMode} />
        {/* Settings button on TopMenu if desired */}
        <button 
          className="settings-btn" 
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Settings"
          style={{ position: 'absolute', top: '2vh', right: '2vw', zIndex: 100 }}
        >
          <Settings size={40} color="#222" />
        </button>
        {isSettingsOpen && (
          <SettingsModal 
            currentSettings={settings} 
            onSave={handleSaveSettings} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        )}
      </>
    );
  }

  return (
    <div className="app-container" style={{ backgroundColor: settings.bgMainColor }}>
      {settings.appMode === 'activity' || settings.appMode === 'advance' ? (
        <ActivityMode settings={settings} />
      ) : (
        <TimerMode settings={settings} />
      )}

      {/* Global Settings Button */}
      <button 
        className="settings-btn" 
        onClick={() => setIsSettingsOpen(true)}
        aria-label="Settings"
      >
        <Settings size={40} />
      </button>

      {/* Home Button */}
      <button 
        className="settings-btn" 
        style={{ right: 'calc(2vw + 60px)' }}
        onClick={() => setCurrentScreen('menu')}
        aria-label="Home"
      >
        <Home size={40} />
      </button>

      {isSettingsOpen && (
        <SettingsModal 
          currentSettings={settings} 
          onSave={handleSaveSettings} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
}

export default App;
