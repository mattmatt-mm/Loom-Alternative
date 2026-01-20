import React, { useState } from 'react';
import { useRecorder } from './hooks/useRecorder';
import './App.css';

function App() {
  const { status, startRecording, stopRecording, cameraStream, mediaStream } = useRecorder();
  const [useCamera, setUseCamera] = useState(false);

  const handleStart = () => {
    startRecording({ withCamera: useCamera });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Loom-like Screen Recorder</h1>
      </header>

      <main className="main-content">
        <div className="preview-area">
          {/* Status Indicator */}
          <div className={`status-badge ${status}`}>
            {status === 'idle' && 'Ready to Record'}
            {status === 'recording' && 'Recording...'}
            {status === 'stopping' && 'Processing...'}
            {status === 'stopped' && 'Saved!'}
          </div>

          {/* Camera Preview Overlay (simulated "Loom bubble") */}
          {useCamera && cameraStream && (
            <div className="camera-preview">
              <video
                autoPlay
                muted
                ref={video => {
                  if (video) video.srcObject = cameraStream;
                }}
              />
            </div>
          )}

          {/* Main Media Preview (optional - might cause feedback loop if recording own screen, but good for confirmation) */}
          {mediaStream && (
            <div className="screen-preview">
              <video
                autoPlay
                muted
                ref={video => {
                  if (video) video.srcObject = mediaStream
                }}
              />
            </div>
          )}

        </div>

        <div className="control-panel">
          <div className="setting-row">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={useCamera}
                onChange={(e) => setUseCamera(e.target.checked)}
                disabled={status === 'recording'}
              />
              <span>Include Camera</span>
            </label>
          </div>

          <div className="action-buttons">
            {status === 'idle' || status === 'stopped' ? (
              <button className="btn-primary start" onClick={handleStart}>
                Start Recording
              </button>
            ) : (
              <button className="btn-danger stop" onClick={stopRecording}>
                Stop Recording
              </button>
            )}
          </div>

          <p className="hint-text">
            Select specific "Tab" or "Window" after clicking Start.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
