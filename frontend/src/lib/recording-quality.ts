export type RecordingQualityPreset = 'COMPACT' | 'BALANCED' | 'READABLE' | 'STUDIO';

export interface QualitySetting {
  preset: RecordingQualityPreset;
  screen1080pBps: number;
  screen720pBps: number;
  cameraWidth: number;
  cameraHeight: number;
  cameraFps: number;
  cameraBps: number;
  estSize10Min: string;
}

export const QUALITY_PRESETS: Record<RecordingQualityPreset, QualitySetting> = {
  COMPACT: { preset: 'COMPACT', screen1080pBps: 1200000, screen720pBps: 800000, cameraWidth: 640, cameraHeight: 360, cameraFps: 15, cameraBps: 500000, estSize10Min: '≈ 25–80 MB per 10 min' },
  BALANCED: { preset: 'BALANCED', screen1080pBps: 2500000, screen720pBps: 1500000, cameraWidth: 1280, cameraHeight: 720, cameraFps: 30, cameraBps: 800000, estSize10Min: '≈ 60–160 MB per 10 min' },
  READABLE: { preset: 'READABLE', screen1080pBps: 4500000, screen720pBps: 2500000, cameraWidth: 1280, cameraHeight: 720, cameraFps: 30, cameraBps: 1200000, estSize10Min: '≈ 120–280 MB per 10 min' },
  STUDIO: { preset: 'STUDIO', screen1080pBps: 6000000, screen720pBps: 3000000, cameraWidth: 1280, cameraHeight: 720, cameraFps: 30, cameraBps: 1200000, estSize10Min: '≈ 150–380 MB per 10 min' }
};

export function getStoredRecordingQuality(): RecordingQualityPreset {
  try {
    const saved = localStorage.getItem('recordingQuality');
    if (saved && saved in QUALITY_PRESETS) return saved as RecordingQualityPreset;
  } catch {}
  return 'READABLE';
}

export function setStoredRecordingQuality(preset: RecordingQualityPreset): void {
  try { localStorage.setItem('recordingQuality', preset); } catch {}
}

export function computeScreenBitrate(
  height: number,
  presetKey: RecordingQualityPreset = 'READABLE',
  maxBitrateKbps?: number
): { bitrateBps: number; isCapped: boolean } {
  const config = QUALITY_PRESETS[presetKey] || QUALITY_PRESETS.READABLE;
  let rawBps: number;

  if (presetKey === 'READABLE') {
    if (height >= 1000) rawBps = 4500000;
    else if (height >= 700) rawBps = 2500000;
    else rawBps = 1200000;
  } else {
    rawBps = height >= 1000 ? config.screen1080pBps : config.screen720pBps;
  }

  const effectiveCapKbps = maxBitrateKbps ?? Number(
    (typeof window !== 'undefined' && (window as any).__RECORDING_MAX_BITRATE_KBPS) ||
    (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.RECORDING_MAX_BITRATE_KBPS) || 0
  );

  if (effectiveCapKbps > 0) {
    const capBps = effectiveCapKbps * 1000;
    if (rawBps > capBps) return { bitrateBps: capBps, isCapped: true };
  }

  return { bitrateBps: rawBps, isCapped: false };
}
