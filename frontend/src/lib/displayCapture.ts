/**
 * W3C Screen Capture specification explicitly forbids `min` constraints for display capture.
 * Chromium enforces this restriction and throws TypeError: "min constraints are not supported"
 * before the display surface picker can even open.
 *
 * `ideal` and `max` constraints are legal and standard. `max: 30` caps capture frame rate cost.
 */
export interface DisplayShareConstraints {
  video: {
    width: { ideal: number };
    height: { ideal: number };
    frameRate: { ideal: number; max: number };
  };
  audio: boolean;
  selfBrowserSurface: string;
}

export function buildDisplayShareConstraints(): DisplayShareConstraints {
  return {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30, max: 30 }
    },
    audio: false,
    selfBrowserSurface: 'exclude'
  };
}
