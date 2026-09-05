import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Monitor, ShieldAlert } from 'lucide-react';
import { Button } from './ui/Button';
import { abortSession, sendTelemetryEvent } from '../services/api';
import { setScreenStream } from '../services/verificationStreams';

interface ShareLostOverlayProps {
  sessionId: number;
  onRestored: (stream: MediaStream) => void;
  onAborted: () => void;
}

export const ShareLostOverlay: React.FC<ShareLostOverlayProps> = ({
  sessionId,
  onRestored,
  onAborted
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isAborting, setIsAborting] = useState(false);
  const expiresAtRef = useRef(Date.now() + 60000);
  const abortedRef = useRef(false);

  useEffect(() => {
    void sendTelemetryEvent({
      sessionId,
      eventType: 'TAB_BLUR',
      metadataDetails: `SHARE_LOST at=${Date.now()}`
    });

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000));
      setRemainingSeconds(diff);

      if (diff === 0 && !abortedRef.current) {
        abortedRef.current = true;
        clearInterval(interval);
        handleAbort('SHARE_LOST_EXPIRED');
      }
    }, 500);

    return () => clearInterval(interval);
  }, [sessionId]);

  const handleAbort = async (reason: string) => {
    setIsAborting(true);
    try {
      await abortSession(sessionId, reason);
    } catch (e) {
      console.warn('Abort notification error:', e);
    } finally {
      onAborted();
    }
  };

  const handleReshare = async () => {
    setIsReconnecting(true);
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 8 } as any,
        audio: false,
        selfBrowserSurface: 'exclude'
      } as any);

      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error('No video track available in capture');

      const settings = track.getSettings ? track.getSettings() : ({} as any);
      const displaySurface = (settings as any).displaySurface;

      if (displaySurface === 'window' || displaySurface === 'browser') {
        track.stop();
        setErrorMsg('Window or tab sharing is not accepted. You must share your entire screen/monitor.');
        void sendTelemetryEvent({
          sessionId,
          eventType: 'TAB_BLUR',
          metadataDetails: `SHARE_SCOPE_REJECTED scope=${displaySurface}`
        });
        return;
      }

      setScreenStream(stream);
      void sendTelemetryEvent({
        sessionId,
        eventType: 'TAB_BLUR',
        metadataDetails: `SHARE_RESTORED at=${Date.now()}`
      });

      onRestored(stream);
    } catch (err: any) {
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        setErrorMsg(err.message || 'Failed to capture screen.');
      }
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-surface border border-danger/40 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-text">Screen Share Disconnected</h2>
          <p className="text-xs text-text-3 leading-relaxed">
            Full-monitor screen share is required for this proctored interview. Your interview turn-taking is paused.
          </p>
        </div>

        <div className="bg-elevated border border-border p-4 rounded-xl space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-text-3 font-semibold block">Time Remaining to Re-share</span>
          <div className={`text-4xl font-mono font-bold ${remainingSeconds <= 15 ? 'text-danger animate-pulse' : 'text-warning'}`}>
            0:{String(remainingSeconds).padStart(2, '0')}
          </div>
          <span className="text-[11px] text-text-3 block">
            Session will be terminated automatically if screen share is not restored.
          </span>
        </div>

        {errorMsg && (
          <div className="bg-danger/10 border border-danger/30 p-2.5 rounded text-xs text-danger flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleReshare}
            loading={isReconnecting || isAborting}
            icon={<Monitor className="w-4 h-4" />}
            className="w-full text-xs font-bold"
          >
            Re-share Entire Monitor
          </Button>

          <button
            type="button"
            onClick={() => handleAbort('USER_VOLUNTARY_EXIT')}
            disabled={isAborting}
            className="text-xs text-text-3 hover:text-danger underline transition-colors cursor-pointer block mx-auto pt-1"
          >
            Exit Assessment Now
          </button>
        </div>
      </div>
    </div>
  );
};
