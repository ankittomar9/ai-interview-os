import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, CheckCircle, Video } from 'lucide-react';
import { sendTelemetryEvent } from '../services/api';
import { Card } from './ui/Card';

interface Props {
  sessionId: number;
}

// NOTE (M5.6): FloatingAiOrb is intentionally EXCLUDED from PhoneProctorView
// because this is a dedicated mobile companion camera stream viewport.
export const PhoneProctorView: React.FC<Props> = ({ sessionId }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOk, setCameraOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startMobileCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraOk(true);

        sendTelemetryEvent({
          sessionId,
          eventType: 'TAB_FOCUS',
          metadataDetails: 'Secondary Mobile Companion Camera Connected and Streaming.'
        });
      } catch (err: any) {
        console.warn('Mobile camera error:', err);
        setErrorMsg('Please allow camera permissions on your phone.');
      }
    };

    startMobileCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-4 text-center select-none">
      <Card padding="lg" variant="elevated" className="w-full max-w-sm flex flex-col items-center gap-4">

        <div className="flex items-center justify-center gap-2">
          <Smartphone className="w-6 h-6 text-primary" />
          <h2 className="text-base font-bold text-white">Mobile Dual-Proctor</h2>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
          <div className={`w-2 h-2 rounded-full ${cameraOk ? 'bg-success' : 'bg-warning'}`} />
          <span className={cameraOk ? 'text-success' : 'text-warning'}>
            {cameraOk ? 'Streaming Desk Feed' : 'Connecting Camera...'}
          </span>
        </div>

        <div className="w-full h-60 bg-black rounded-lg overflow-hidden relative">
          {errorMsg ? (
            <div className="h-full flex flex-col items-center justify-center p-3">
              <Video className="w-8 h-8 text-danger mb-2" />
              <span className="text-xs text-danger">{errorMsg}</span>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 text-xs text-text-2 leading-relaxed text-left flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-primary-2 shrink-0 mt-0.5" />
          <span>
            Position your phone to view your <strong>desk, keyboard, and screen</strong> at a 45° angle. Keep this tab open during your assessment.
          </span>
        </div>

      </Card>
    </div>
  );
};