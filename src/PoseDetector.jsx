import React, { useEffect, useRef, useState } from 'react';

/**
 * MediaPipe Pose を使って体の移動方向（8方向）を検出するコンポーネント。
 * MediaPipe の UMD スクリプトは index.html で CDN から読み込み済みの前提で、
 * window.Pose / window.Camera / window.drawConnectors などにアクセスします。
 *
 * Props:
 *   targetDir  - アプリが提示している方向文字列 ("right" | "left" | "up" | "down" | ...)
 *   onResult   - { detected: string|null, isOk: boolean } を受け取るコールバック
 *   inline     - true のとき、コンテナ内に大きく表示（false のとき固定オーバーレイ）
 */

const SMOOTHING = 0.7;
const MIN_MAGNITUDE = 0.006;

function angleToDirection(angleDeg) {
  const dirs = [
    { name: 'right',      min: -22.5,   max:  22.5  },
    { name: 'up-right',   min:  22.5,   max:  67.5  },
    { name: 'up',         min:  67.5,   max: 112.5  },
    { name: 'up-left',    min: 112.5,   max: 157.5  },
    { name: 'down-left',  min: -157.5,  max: -112.5 },
    { name: 'down',       min: -112.5,  max: -67.5  },
    { name: 'down-right', min: -67.5,   max: -22.5  },
  ];
  for (const d of dirs) {
    if (angleDeg >= d.min && angleDeg < d.max) return d.name;
  }
  return 'left';
}

function avgLandmarks(lm, indices) {
  let x = 0, y = 0;
  for (const i of indices) { x += lm[i].x; y += lm[i].y; }
  return { x: x / indices.length, y: y / indices.length };
}

const DIR_ICON = {
  right: '→', left: '←', up: '↑', down: '↓',
  'up-right': '↗', 'up-left': '↖', 'down-right': '↘', 'down-left': '↙',
};

export default function PoseDetector({ targetDir, onResult, inline = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const poseRef = useRef(null);
  const prevCenterRef = useRef(null);
  const smoothedRef = useRef({ x: 0, y: 0 });
  const onResultRef = useRef(onResult);
  const targetDirRef = useRef(targetDir);

  const [detected, setDetected] = useState(null);
  const [isOk, setIsOk] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { targetDirRef.current = targetDir; }, [targetDir]);

  useEffect(() => {
    if (!window.Pose || !window.Camera) {
      setError('MediaPipe 読み込み中…');
      let tries = 0;
      const id = setInterval(() => {
        tries++;
        if (window.Pose && window.Camera) {
          clearInterval(id);
          setError(null);
          return initMediaPipe();
        } else if (tries > 50) {
          clearInterval(id);
          setError('MediaPipe の読み込みに失敗しました');
        }
      }, 100);
      return () => clearInterval(id);
    } else {
      return initMediaPipe();
    }

    function initMediaPipe() {
      let cancelled = false;

      const pose = new window.Pose({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.save();
        ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        if (!results.poseLandmarks) {
          prevCenterRef.current = null;
          smoothedRef.current = { x: 0, y: 0 };
          setDetected(null);
          setIsOk(false);
          onResultRef.current?.({ detected: null, isOk: false });
          return;
        }

        const lm = results.poseLandmarks;

        if (window.drawConnectors && window.drawLandmarks && window.POSE_CONNECTIONS) {
          ctx.save();
          ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
          window.drawConnectors(ctx, lm, window.POSE_CONNECTIONS, {
            color: 'rgba(0,255,100,0.7)', lineWidth: 2,
          });
          window.drawLandmarks(ctx, lm, {
            color: 'rgba(255,255,0,0.9)', lineWidth: 1, radius: 3,
          });
          ctx.restore();
        }

        const center = avgLandmarks(lm, [11, 12, 23, 24]);

        if (prevCenterRef.current) {
          const rawDx = -(center.x - prevCenterRef.current.x);
          const rawDy = -(center.y - prevCenterRef.current.y);

          const sv = smoothedRef.current;
          sv.x = SMOOTHING * sv.x + (1 - SMOOTHING) * rawDx;
          sv.y = SMOOTHING * sv.y + (1 - SMOOTHING) * rawDy;

          const mag = Math.sqrt(sv.x * sv.x + sv.y * sv.y);

          if (mag < MIN_MAGNITUDE) {
            setDetected(null);
            setIsOk(false);
            onResultRef.current?.({ detected: null, isOk: false });
          } else {
            const angleDeg = (Math.atan2(sv.y, sv.x) * 180) / Math.PI;
            const dir = angleToDirection(angleDeg);
            const ok = dir === targetDirRef.current;
            setDetected(dir);
            setIsOk(ok);
            onResultRef.current?.({ detected: dir, isOk: ok });
          }
        }

        prevCenterRef.current = center;
      });

      poseRef.current = pose;

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (!cancelled && videoRef.current && poseRef.current) {
            await poseRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
        facingMode: 'user',
      });

      camera.start()
        .then(() => { if (!cancelled) cameraRef.current = camera; })
        .catch((err) => {
          if (!cancelled) {
            console.error('Camera start error:', err);
            setError('カメラにアクセスできません');
          }
        });

      return () => {
        cancelled = true;
        cameraRef.current?.stop();
        poseRef.current?.close();
        cameraRef.current = null;
        poseRef.current = null;
        prevCenterRef.current = null;
        smoothedRef.current = { x: 0, y: 0 };
      };
    }
  }, []);

  /* ─── インラインモード（大きな表示） ─── */
  if (inline) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {/* カメラプレビュー（アスペクト比 4:3 を維持して最大化） */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxHeight: '100%',
            aspectRatio: '4 / 3',
            borderRadius: '16px',
            overflow: 'hidden',
            border: isOk
              ? '5px solid rgba(0,255,136,0.95)'
              : '4px solid rgba(255,255,255,0.5)',
            boxShadow: isOk
              ? '0 0 40px rgba(0,255,136,0.85)'
              : '0 6px 24px rgba(0,0,0,0.6)',
            transition: 'border-color 0.12s, box-shadow 0.12s',
            backgroundColor: '#111',
            flex: '1 1 auto',
          }}
        >
          <video ref={videoRef} style={{ display: 'none' }} playsInline />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          {/* エラー表示 */}
          {error && (
            <div
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.72)',
                color: '#ff8080',
                fontSize: '1rem',
                textAlign: 'center',
                padding: '12px',
              }}
            >
              {error}
            </div>
          )}

          {/* 検出方向アイコン（大きめ） */}
          {detected && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '12px',
                fontSize: '3rem',
                color: isOk ? '#00ff88' : '#ffffff',
                textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                lineHeight: 1,
              }}
            >
              {DIR_ICON[detected]}
            </div>
          )}

          {/* 正解バナー */}
          {isOk && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,200,100,0.92)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '1.3rem',
                padding: '6px 24px',
                borderRadius: '30px',
                letterSpacing: '0.06em',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              ✓ せいかい！
            </div>
          )}
        </div>

        {/* ステータスラベル */}
        <div
          style={{
            backgroundColor: detected
              ? isOk ? 'rgba(0,190,90,0.9)' : 'rgba(30,30,30,0.85)'
              : 'rgba(30,30,30,0.75)',
            color: 'white',
            borderRadius: '8px',
            padding: '5px 14px',
            fontSize: '1rem',
            fontWeight: 'bold',
            letterSpacing: '0.04em',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
            transition: 'background-color 0.12s',
            flexShrink: 0,
          }}
        >
          {error
            ? '⚠ カメラエラー'
            : detected
              ? `${DIR_ICON[detected]} ${isOk ? '✓ せいかい！' : '検出中…'}`
              : '📷 待機中…'}
        </div>
      </div>
    );
  }

  /* ─── オーバーレイモード（小さな固定表示） ─── */
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2vh',
        left: '2vw',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '160px',
          height: '120px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: isOk ? '3px solid rgba(0,255,136,0.9)' : '3px solid rgba(255,255,255,0.35)',
          boxShadow: isOk ? '0 0 18px rgba(0,255,136,0.75)' : '0 4px 14px rgba(0,0,0,0.55)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          backgroundColor: '#111',
        }}
      >
        <video ref={videoRef} style={{ display: 'none' }} playsInline />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.72)', color: '#ff8080', fontSize: '0.68rem', textAlign: 'center', padding: '8px' }}>
            {error}
          </div>
        )}
        {detected && (
          <div style={{ position: 'absolute', top: '4px', right: '6px', fontSize: '1.5rem', color: isOk ? '#00ff88' : '#ffffff', textShadow: '0 1px 5px rgba(0,0,0,0.9)', lineHeight: 1 }}>
            {DIR_ICON[detected]}
          </div>
        )}
      </div>
      <div
        style={{
          backgroundColor: detected ? (isOk ? 'rgba(0,190,90,0.88)' : 'rgba(30,30,30,0.82)') : 'rgba(30,30,30,0.72)',
          color: 'white',
          borderRadius: '6px',
          padding: '3px 9px',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
          transition: 'background-color 0.15s',
        }}
      >
        {error ? '⚠ カメラエラー' : detected ? `${DIR_ICON[detected]} ${isOk ? '✓ 正解！' : '検出中…'}` : '📷 待機中…'}
      </div>
    </div>
  );
}
