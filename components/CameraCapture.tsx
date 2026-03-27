
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { X, SwitchCameraIcon, FlashOnIcon, FlashOffIcon } from './Icons';

interface CameraCaptureProps {
    onCapture: (imageDataUrl: string) => void;
    onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [hasFlash, setHasFlash] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);

    useEffect(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        let isCancelled = false;

        const setupStream = (stream: MediaStream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;

                const track = stream.getVideoTracks()[0];
                if (track) {
                    const capabilities = track.getCapabilities() as any;
                    const hasTorch = !!capabilities.torch;
                    setHasFlash(hasTorch);
                    if (!hasTorch) {
                        setIsFlashOn(false); // Turn off flash if not supported
                    }
                } else {
                    setHasFlash(false);
                    setIsFlashOn(false);
                }
            }
        };
        
        const startCamera = async () => {
            // First, try the desired facing mode
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
                if (!isCancelled) setupStream(stream);
            } catch (err) {
                console.warn(`Could not access ${facingMode} camera, trying the other one.`, err);
                const otherMode = facingMode === 'environment' ? 'user' : 'environment';
                
                // Try the other camera as a fallback
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: otherMode } });
                    if (!isCancelled) {
                        setupStream(stream);
                        setFacingMode(otherMode); // Update state to reflect the working camera
                    }
                } catch (finalErr) {
                    if (isCancelled) return;
                    
                    const finalError = finalErr as Error & { name: string };
                    let alertMessage = "Could not access camera. Please ensure it's not in use by another application and that you've granted permissions.";

                    if (finalError.name === 'NotFoundError' || finalError.name === 'DevicesNotFoundError') {
                        alertMessage = "No camera was found on your device. You can still proceed by uploading a file instead.";
                    } else if (finalError.name === 'NotAllowedError' || finalError.name === 'PermissionDeniedError') {
                        alertMessage = "Camera access was denied. Please grant camera permission in your browser settings to use this feature.";
                    } else if (finalError.name === 'NotReadableError' || finalError.name === 'TrackStartError') {
                        alertMessage = "Your camera might be in use by another application. Please close it and try again.";
                    }

                    console.error("Error accessing any camera:", finalError);
                    alert(alertMessage);
                    onClose();
                }
            }
        };

        startCamera();

        return () => {
            isCancelled = true;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode, onClose]);

    const handleCapture = useCallback(() => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                 if (facingMode === 'user') {
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                }
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                onCapture(dataUrl);
            }
            onClose();
        }
    }, [onCapture, onClose, facingMode]);
    
    const handleToggleCamera = () => {
        setIsFlashOn(false);
        setHasFlash(false);
        setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    };

    const handleToggleFlash = useCallback(async () => {
        if (!streamRef.current || !hasFlash) return;
        const track = streamRef.current.getVideoTracks()[0];
        if (!track) return;

        try {
            const newFlashState = !isFlashOn;
            await track.applyConstraints({
                advanced: [{ torch: newFlashState } as any]
            });
            setIsFlashOn(newFlashState);
        } catch (err) {
            console.error("Failed to toggle flash:", err);
            alert("Could not toggle the flash on this device.");
        }
    }, [hasFlash, isFlashOn]);


    return (
        <div className="fixed inset-0 bg-black z-50 animate-fade-in-up">
            <div className="w-full h-full relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-black" style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }}></video>
                
                {/* Controls Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-6">
                    {/* Top controls */}
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-4">
                           <button onClick={handleToggleCamera} className="text-white bg-black/40 rounded-full p-3 hover:bg-black/60 transition-colors" aria-label="Switch camera">
                               <SwitchCameraIcon className="w-6 h-6" />
                           </button>
                           {hasFlash && (
                               <button onClick={handleToggleFlash} className="text-white bg-black/40 rounded-full p-3 hover:bg-black/60 transition-colors" aria-label="Toggle flash">
                                   {isFlashOn ? <FlashOnIcon className="w-6 h-6" /> : <FlashOffIcon className="w-6 h-6" />}
                               </button>
                           )}
                        </div>
                        <button onClick={onClose} className="text-white bg-black/40 rounded-full p-3 hover:bg-black/60 transition-colors" aria-label="Close camera">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Bottom controls (Capture button) */}
                    <div className="flex justify-center">
                         <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 hover:border-white hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white active:scale-95" aria-label="Capture photo"></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CameraCapture;
