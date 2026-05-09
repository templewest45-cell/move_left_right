import React from 'react';

export default function TopMenu({ onSelectMode }) {
  return (
    <div 
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFE566', // Approximate background color of the image to blend
        overflow: 'hidden'
      }}
    >
      <div 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '177.78vh', // 16:9 aspect ratio max width
          aspectRatio: '16/9',
          backgroundImage: 'url(/top_menu_bg.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Activity Mode Button (左右に動こう) */}
        <button
          onClick={() => onSelectMode('activity')}
          style={{
            position: 'absolute',
            top: '23%',
            left: '6.5%',
            width: '36%',
            height: '57%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
            // uncomment the line below to debug hit areas
            // border: '2px solid red' 
          }}
          aria-label="左右に動こう"
        />

        {/* Advance Mode Button (矢印どおりに動こう) */}
        <button
          onClick={() => onSelectMode('advance')}
          style={{
            position: 'absolute',
            top: '23%',
            left: '57.5%',
            width: '36%',
            height: '57%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
            // border: '2px solid blue'
          }}
          aria-label="矢印どおりに動こう"
        />

        {/* Timer Mode Button (タイマーモード) */}
        <button
          onClick={() => onSelectMode('timer')}
          style={{
            position: 'absolute',
            top: '82%',
            left: '27%',
            width: '46%',
            height: '16%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
            // border: '2px solid green'
          }}
          aria-label="タイマーモード"
        />
      </div>
    </div>
  );
}
