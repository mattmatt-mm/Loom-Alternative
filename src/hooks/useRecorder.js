import { useState, useRef, useEffect, useCallback } from 'react';

export const useRecorder = () => {
    const [status, setStatus] = useState('idle'); // idle, recording, stopping, stopped
    const [mediaStream, setMediaStream] = useState(null);
    const [cameraStream, setCameraStream] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    // Start Screen Recording
    const startRecording = useCallback(async (options = { withCamera: false }) => {
        try {
            // 1. Get Screen Stream (allows Tab/Window/Screen selection)
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen' },
                audio: true
            });

            let finalStream = displayStream;

            // 2. Optional Camera Stream
            if (options.withCamera) {
                try {
                    const camStream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false // Audio already captured from displayStream or separate mic
                    });
                    setCameraStream(camStream);
                    
                    // Note: merging streams into a single video file requires canvas or Web Audio API compositing.
                    // For MVP, we might display camera in UI but record only screen, OR
                    // we simple record the screen which will capture the app's UI including the camera preview if it's on top.
                    // "Loom-like" usually means the camera is an overlay on the screen.
                    // If we want the output video to effectively have the camera, the users usually "record the screen" 
                    // and the camera is just a floating div on the screen that gets recorded.
                    // However, `getDisplayMedia` might NOT capture the browser UI overlaying it if recording a specific tab/window.
                    // If recording "Entire Screen", it captures everything.
                    // For "Tab" recording, chrome tabs don't capture the overlay DOM elements of the *recording* app unless the recording app IS the tab.
                    // Let's assume for now we record the stream provided by getDisplayMedia. 
                    
                } catch (err) {
                   console.error("Camera access denied or failed", err);
                }
            }

            // 3. Setup MediaRecorder
            const recorder = new MediaRecorder(finalStream, { mimeType: 'video/webm; codecs=vp9' });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
               const blob = new Blob(chunksRef.current, { type: 'video/webm' });
               const url = URL.createObjectURL(blob);
               downloadVideo(url);
               cleanup();
               setStatus('stopped');
            };

            // Handle user stopping via browser UI
            displayStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            recorder.start();
            setMediaStream(displayStream);
            setStatus('recording');

        } catch (error) {
            console.error("Error starting recording:", error);
            setStatus('idle');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            setStatus('stopping');
            mediaRecorderRef.current.stop();
        }
    }, []);

    const cleanup = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        setMediaStream(null);
        setCameraStream(null);
    };

    const downloadVideo = (url) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return {
        status,
        startRecording,
        stopRecording,
        mediaStream,
        cameraStream
    };
};
