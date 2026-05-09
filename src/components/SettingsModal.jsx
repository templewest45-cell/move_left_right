import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function SettingsModal({ currentSettings, onSave, onClose }) {
  const [localSettings, setLocalSettings] = useState({ ...currentSettings });

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Parse numeric values before saving
    const finalSettings = {
      ...localSettings,
      totalCount: parseInt(localSettings.totalCount, 10),
      totalTime: parseInt(localSettings.totalTime, 10),
      intervalTime: parseInt(localSettings.intervalTime, 10),
      timerDuration: parseInt(localSettings.timerDuration, 10),
    };
    onSave(finalSettings);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>設定</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>



        <hr style={{ margin: '20px 0', border: '1px solid #eee' }} />
        <h3>共通設定</h3>
        
        <div className="setting-group" style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
          <div style={{ flex: 1 }}>
            <label>メイン背景色 (オレンジ)</label>
            <input 
              type="color" 
              value={localSettings.bgMainColor} 
              onChange={e => handleChange('bgMainColor', e.target.value)}
              style={{ height: '40px', padding: '0', cursor: 'pointer' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>下部背景色 (ブルー)</label>
            <input 
              type="color" 
              value={localSettings.bgBottomColor} 
              onChange={e => handleChange('bgBottomColor', e.target.value)}
              style={{ height: '40px', padding: '0', cursor: 'pointer' }}
            />
          </div>
        </div>

        <div className="setting-group" style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
          <div style={{ flex: 1 }}>
            <label>プログレスボックスの色</label>
            <input 
              type="color" 
              value={localSettings.boxColor} 
              onChange={e => handleChange('boxColor', e.target.value)}
              style={{ height: '40px', padding: '0', cursor: 'pointer' }}
            />
          </div>
        </div>

        <div className="setting-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={localSettings.playSE} 
              onChange={e => handleChange('playSE', e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            切り替わり時に効果音(ピッ)を鳴らす
          </label>
          
          {localSettings.playSE && (
            <div style={{ marginTop: '10px', paddingLeft: '30px' }}>
              <label style={{ display: 'inline-block', width: '80px', fontSize: '0.9rem' }}>音量: {localSettings.seVolume}%</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={localSettings.seVolume || 50} 
                onChange={e => handleChange('seVolume', parseInt(e.target.value, 10))}
                style={{ verticalAlign: 'middle', width: '150px' }}
              />
            </div>
          )}
        </div>

        <div className="setting-group">
          <label>BGM</label>
          <select 
            value={localSettings.bgmType} 
            onChange={e => handleChange('bgmType', e.target.value)}
            style={{ marginBottom: '10px' }}
          >
            <option value="none">なし</option>
            <option value="tengoku">天国と地獄 (運動会BGM)</option>
            <option value="custom">カスタムファイルを選択</option>
          </select>
          
          {localSettings.bgmType !== 'none' && (
            <div style={{ marginTop: '10px', marginBottom: '15px' }}>
              <label style={{ display: 'inline-block', width: '80px', fontSize: '0.9rem' }}>音量: {localSettings.bgmVolume !== undefined ? localSettings.bgmVolume : 50}%</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={localSettings.bgmVolume !== undefined ? localSettings.bgmVolume : 50} 
                onChange={e => handleChange('bgmVolume', parseInt(e.target.value, 10))}
                style={{ verticalAlign: 'middle', width: '150px' }}
              />
            </div>
          )}

          {localSettings.bgmType === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="file" 
                accept="audio/*"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    handleChange('bgmUrl', url);
                    handleChange('bgmName', file.name);
                  }
                }}
                style={{ fontSize: '0.9rem' }}
              />
              {localSettings.bgmName && <span style={{ fontSize: '0.9rem', color: '#666' }}>選択中: {localSettings.bgmName}</span>}
            </div>
          )}
        </div>

        {(localSettings.appMode === 'activity' || localSettings.appMode === 'advance') && (
          <>
            <hr style={{ margin: '20px 0', border: '1px solid #eee' }} />
            <h3>{localSettings.appMode === 'activity' ? '活動モード設定' : 'アドバンスモード設定'}</h3>
            
            {localSettings.appMode === 'activity' && (
              <div className="setting-group" style={{ marginTop: '15px' }}>
                <label>表示方法</label>
                <select 
                  value={localSettings.cueType} 
                  onChange={e => handleChange('cueType', e.target.value)}
                >
                  <option value="hiragana">ひらがな（ひだり / みぎ）</option>
                  <option value="katakana">カタカナ（ヒダリ / ミギ）</option>
                  <option value="kanji">漢字（左 / 右）</option>
                  <option value="arrow">矢印（← / →）</option>
                  <option value="color">色（カスタム色）</option>
                </select>
              </div>
            )}

            {localSettings.appMode === 'advance' && (
              <div className="setting-group" style={{ marginTop: '15px' }}>
                <label>使用する方向</label>
                <select 
                  value={localSettings.advanceDirectionType || 'all'} 
                  onChange={e => handleChange('advanceDirectionType', e.target.value)}
                >
                  <option value="all">8方向すべて</option>
                  <option value="orthogonal">前後左右のみ（4方向）</option>
                  <option value="diagonal">斜めのみ（4方向）</option>
                </select>
              </div>
            )}

            {localSettings.appMode === 'activity' && localSettings.cueType === 'color' && (
              <div className="setting-group" style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label>左の色</label>
                  <input 
                    type="color" 
                    value={localSettings.colorLeft} 
                    onChange={e => handleChange('colorLeft', e.target.value)}
                    style={{ height: '40px', padding: '0', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>右の色</label>
                  <input 
                    type="color" 
                    value={localSettings.colorRight} 
                    onChange={e => handleChange('colorRight', e.target.value)}
                    style={{ height: '40px', padding: '0', cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}

            <div className="setting-group">
              <label>出題パターン</label>
              <select 
                value={localSettings.sequence} 
                onChange={e => handleChange('sequence', e.target.value)}
              >
                <option value="random">ランダムに表示</option>
                {localSettings.appMode === 'advance' ? (
                  <>
                    <option value="alternating">規則的に表示（時計回り）</option>
                    <option value="analog">アナログ操作（手動で方向を切り替え）</option>
                  </>
                ) : (
                  <>
                    <option value="alternating">規則的に表示（左右交互）</option>
                    <option value="analog">アナログ操作（手動で左右を切り替え）</option>
                  </>
                )}
              </select>
            </div>

            <div className="setting-group">
              <label>切り替わり間隔 (秒)</label>
              <input 
                type="number" 
                min="1" 
                max="10" 
                value={localSettings.intervalTime} 
                onChange={e => handleChange('intervalTime', e.target.value)}
              />
            </div>

            {localSettings.appMode === 'activity' && (
              <>
                <div className="setting-group">
                  <label>終了条件</label>
                  <select 
                    value={localSettings.endCondition} 
                    onChange={e => handleChange('endCondition', e.target.value)}
                  >
                    <option value="count">残り回数で終了</option>
                    <option value="time">残り時間で終了</option>
                  </select>
                </div>

                {localSettings.endCondition === 'count' ? (
                  <div className="setting-group">
                    <label>設定回数 (回)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={localSettings.totalCount} 
                      onChange={e => handleChange('totalCount', e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="setting-group">
                    <label>設定時間 (秒)</label>
                    <input 
                      type="number" 
                      min="10" 
                      max="600" 
                      value={localSettings.totalTime} 
                      onChange={e => handleChange('totalTime', e.target.value)}
                    />
                  </div>
                )}

                <div className="setting-group">
                  <label>残り（回数・時間）の表示形式</label>
                  <select 
                    value={localSettings.progressDisplayType} 
                    onChange={e => handleChange('progressDisplayType', e.target.value)}
                  >
                    <option value="text">テキストで表示（数字）</option>
                    <option value="visual">ボックスで表示（視覚的）</option>
                  </select>
                </div>
              </>
            )}
          </>
        )}

        {localSettings.appMode === 'timer' && (
          <>
            <hr style={{ margin: '20px 0', border: '1px solid #eee' }} />
            <h3>タイマーモード設定</h3>
            
            <div className="setting-group" style={{ marginTop: '15px' }}>
              <label>タイマー形式</label>
              <select 
                value={localSettings.timerType} 
                onChange={e => handleChange('timerType', e.target.value)}
              >
                <option value="countdown">カウントダウン（減算）</option>
                <option value="stopwatch">ストップウォッチ（加算）</option>
              </select>
            </div>

            {localSettings.timerType === 'countdown' && (
              <div className="setting-group">
                <label>カウントダウン時間 (秒)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="3600" 
                  value={localSettings.timerDuration} 
                  onChange={e => handleChange('timerDuration', e.target.value)}
                />
              </div>
            )}
          </>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleSave}>保存して閉じる</button>
        </div>
      </div>
    </div>
  );
}
