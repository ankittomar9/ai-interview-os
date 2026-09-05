import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeScreenBitrate,
  QUALITY_PRESETS,
  type RecordingQualityPreset
} from './recording-quality';

test('recording quality presets and D2 bitrate ladder', () => {
  // READABLE (default D2 ladder): 4.5 Mbps >= 1000, 2.5 Mbps >= 700, 1.2 Mbps else
  assert.equal(computeScreenBitrate(1080, 'READABLE').bitrateBps, 4500000);
  assert.equal(computeScreenBitrate(720, 'READABLE').bitrateBps, 2500000);
  assert.equal(computeScreenBitrate(600, 'READABLE').bitrateBps, 1200000);

  // COMPACT preset: 1.2 Mbps >= 1000, 0.8 Mbps <= 720
  assert.equal(computeScreenBitrate(1080, 'COMPACT').bitrateBps, 1200000);
  assert.equal(computeScreenBitrate(720, 'COMPACT').bitrateBps, 800000);

  // BALANCED preset: 2.5 Mbps >= 1000, 1.5 Mbps <= 720
  assert.equal(computeScreenBitrate(1080, 'BALANCED').bitrateBps, 2500000);
  assert.equal(computeScreenBitrate(720, 'BALANCED').bitrateBps, 1500000);

  // STUDIO preset: 6.0 Mbps >= 1000, 3.0 Mbps <= 720
  assert.equal(computeScreenBitrate(1080, 'STUDIO').bitrateBps, 6000000);
  assert.equal(computeScreenBitrate(720, 'STUDIO').bitrateBps, 3000000);

  // Verify all 4 presets exist
  const presets: RecordingQualityPreset[] = ['COMPACT', 'BALANCED', 'READABLE', 'STUDIO'];
  for (const p of presets) {
    assert.ok(QUALITY_PRESETS[p], `Preset ${p} must exist`);
    assert.ok(QUALITY_PRESETS[p].estSize10Min.length > 0);
  }
});

test('operator clamp wins over user preset preference (AC-11)', () => {
  // User selects STUDIO at 1080p (6.0 Mbps), but operator env caps at 2000 kbps (2.0 Mbps)
  const result = computeScreenBitrate(1080, 'STUDIO', 2000);
  assert.equal(result.bitrateBps, 2000000);
  assert.equal(result.isCapped, true);

  // User selects READABLE at 1080p (4.5 Mbps), operator cap 3000 kbps
  const resReadable = computeScreenBitrate(1080, 'READABLE', 3000);
  assert.equal(resReadable.bitrateBps, 3000000);
  assert.equal(resReadable.isCapped, true);

  // When cap is higher than preset bitrate, no clamp occurs
  const resUncapped = computeScreenBitrate(1080, 'COMPACT', 5000);
  assert.equal(resUncapped.bitrateBps, 1200000);
  assert.equal(resUncapped.isCapped, false);
});
