import { useEffect, useRef, useState, useCallback } from 'react';
import { sendTelemetryEvent } from '../services/api';

export const useProctorSentinel = (sessionId: number | null, isActive: boolean) => {
    const [tabSwitches, setTabSwitches] = useState<number>(0);
    const [pasteDumps, setPasteDumps] = useState<number>(0);
    const blurStartTimeRef = useRef<number | null>(null);
    const lastVisibilityBlurRef = useRef<number>(0);
    const lastActivityTimeRef = useRef<number>(Date.now());
    const gapEmittedRef = useRef<boolean>(false);

    const markActivity = useCallback(() => {
        lastActivityTimeRef.current = Date.now();
        gapEmittedRef.current = false;
    }, []);

    useEffect(() => {
        if (!sessionId || !isActive) return;

        lastActivityTimeRef.current = Date.now();
        gapEmittedRef.current = false;

        const handleVisibilityChange = () => {
            markActivity();
            if (document.hidden) {
                const now = Date.now();
                if (now - lastVisibilityBlurRef.current >= 1000) {
                    lastVisibilityBlurRef.current = now;
                    blurStartTimeRef.current = now;
                    setTabSwitches((prev) => prev + 1);
                }
            } else {
                const awaySeconds = blurStartTimeRef.current
                    ? Math.round((Date.now() - blurStartTimeRef.current) / 1000)
                    : 0;

                try {
                    sendTelemetryEvent({
                        sessionId,
                        eventType: 'TAB_BLUR',
                        durationSeconds: awaySeconds,
                        metadataDetails: `Candidate returned after ${awaySeconds}s window blur.`
                    }).catch((err) => console.warn('[useProctorSentinel] Failed to send TAB_BLUR telemetry:', err));
                } catch (err) {
                    console.warn('[useProctorSentinel] Fail-neutral error on TAB_BLUR:', err);
                }
                blurStartTimeRef.current = null;
            }
        };

        const handlePaste = (e: ClipboardEvent) => {
            markActivity();
            const text = e.clipboardData?.getData('text') || '';
            if (text.length > 80) {
                setPasteDumps((prev) => prev + 1);
                try {
                    sendTelemetryEvent({
                        sessionId,
                        eventType: 'PASTE_DUMP',
                        characterCount: text.length,
                        metadataDetails: `Instant paste dump of ${text.length} characters.`
                    }).catch((err) => console.warn('[useProctorSentinel] Failed to send PASTE_DUMP telemetry:', err));
                } catch (err) {
                    console.warn('[useProctorSentinel] Fail-neutral error on PASTE_DUMP:', err);
                }
            }
        };

        const handleInteraction = () => {
            markActivity();
        };

        // Inactivity / silence gap detector (>= 60s without speech or interaction)
        const checkGapInterval = setInterval(() => {
            try {
                const now = Date.now();
                const idleSecs = Math.floor((now - lastActivityTimeRef.current) / 1000);
                if (idleSecs >= 60 && !gapEmittedRef.current) {
                    gapEmittedRef.current = true;
                    sendTelemetryEvent({
                        sessionId,
                        eventType: 'NO_SPEECH_GAP',
                        durationSeconds: idleSecs,
                        metadataDetails: `Continuous inactivity & silence gap of ${idleSecs}s observed during active interview stage.`
                    }).catch((err) => {
                        console.warn('[useProctorSentinel] Telemetry ingest warning (fail-neutral):', err);
                    });
                }
            } catch (err) {
                // Fail-neutral: detector errors must never block or fail the session
                console.warn('[useProctorSentinel] Fail-neutral error in silence detector:', err);
            }
        }, 5000);

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('paste', handlePaste);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('pointerdown', handleInteraction);

        return () => {
            clearInterval(checkGapInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('paste', handlePaste);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('pointerdown', handleInteraction);
        };
    }, [sessionId, isActive, markActivity]);

    return { tabSwitches, pasteDumps, markActivity };
};