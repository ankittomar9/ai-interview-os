import { useEffect, useRef, useState } from 'react';
import { sendTelemetryEvent } from '../services/api';

export const useProctorSentinel = (sessionId: number | null, isActive: boolean) => {
    const [tabSwitches, setTabSwitches] = useState<number>(0);
    const [pasteDumps, setPasteDumps] = useState<number>(0);
    const blurStartTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (!sessionId || !isActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                blurStartTimeRef.current = Date.now();
                setTabSwitches((prev) => prev + 1);
            } else {
                const awaySeconds = blurStartTimeRef.current
                    ? Math.round((Date.now() - blurStartTimeRef.current) / 1000)
                    : 0;

                sendTelemetryEvent({
                    sessionId,
                    eventType: 'TAB_BLUR',
                    durationSeconds: awaySeconds,
                    metadataDetails: `Candidate returned after ${awaySeconds}s window blur.`
                });
                blurStartTimeRef.current = null;
            }
        };

        const handlePaste = (e: ClipboardEvent) => {
            const text = e.clipboardData?.getData('text') || '';
            if (text.length > 80) {
                setPasteDumps((prev) => prev + 1);
                sendTelemetryEvent({
                    sessionId,
                    eventType: 'PASTE_DUMP',
                    characterCount: text.length,
                    metadataDetails: `Instant paste dump of ${text.length} characters.`
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('paste', handlePaste);
        };
    }, [sessionId, isActive]);

    return { tabSwitches, pasteDumps };
};