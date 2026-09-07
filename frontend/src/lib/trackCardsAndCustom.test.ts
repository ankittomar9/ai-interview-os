import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TRACK_OPTIONS } from '../components/setup/TrackGrid';
import {
  CUSTOM_AVAILABLE_DOMAINS,
  CUSTOM_PRESETS,
  calculateCustomTotal,
  formatCustomPlanPreview,
  getPlanPreset
} from './plan-presets';
import type { CustomDomainConfig } from '../types';

describe('P2: Track Cards Consolidation & Custom Plan Builder', () => {
  test('TRACK_OPTIONS has exactly 6 cards with correct tracks and legacy cards purged', () => {
    assert.strictEqual(TRACK_OPTIONS.length, 6, 'Must contain exactly 6 track cards');

    const trackKeys = TRACK_OPTIONS.map((o) => o.track);
    assert.deepStrictEqual(trackKeys, [
      'ALGORITHMS_DATA_STRUCTURES',
      'SPRING_LLD',
      'SYSTEM_DESIGN',
      'SQL',
      'RESUME_BASED',
      'CUSTOM'
    ]);

    // Ensure legacy cards are purged from code
    assert.strictEqual(trackKeys.includes('FULL_LOOP' as any), false, 'FULL_LOOP card must be removed');
    assert.strictEqual(trackKeys.includes('DSA_LLD' as any), false, 'DSA_LLD card must be removed');
    assert.strictEqual(trackKeys.includes('DSA_LLD_HLD' as any), false, 'DSA_LLD_HLD card must be removed');
    assert.strictEqual(trackKeys.includes('LLD_HLD' as any), false, 'LLD_HLD card must be removed');
  });

  test('Persona filtering: NON_TECH hides tech cards and shows only Others and Custom', () => {
    const techOptions = TRACK_OPTIONS.filter((o) => !o.isTechOnly);
    assert.strictEqual(techOptions.length, 2, 'Non-tech persona must only have 2 cards');

    const nonTechTracks = techOptions.map((o) => o.track);
    assert.deepStrictEqual(nonTechTracks, ['RESUME_BASED', 'CUSTOM']);
  });

  test('Custom Builder: all 5 domains are available with valid defaults and tech constraints', () => {
    assert.strictEqual(CUSTOM_AVAILABLE_DOMAINS.length, 5, 'Must provide 5 selectable domains');

    const domainKeys = CUSTOM_AVAILABLE_DOMAINS.map((d) => d.domain);
    assert.deepStrictEqual(domainKeys, [
      'ALGORITHMS_DATA_STRUCTURES',
      'SPRING_LLD',
      'SYSTEM_DESIGN',
      'SQL',
      'RESUME_BASED'
    ]);

    for (const d of CUSTOM_AVAILABLE_DOMAINS) {
      assert.ok(d.defaultMinutes >= 10 && d.defaultMinutes <= 60, 'Default minutes within 10-60');
      assert.strictEqual(d.defaultMinutes % 5, 0, 'Default minutes must be divisible by 5');
    }
  });

  test('Custom Presets: All, DSA+HLD, DSA+LLD match specifications and satisfy <= 120 min ceiling', () => {
    // Preset ALL
    const allTotal = calculateCustomTotal(CUSTOM_PRESETS.ALL);
    assert.strictEqual(CUSTOM_PRESETS.ALL.length, 5, 'ALL preset selects 5 domains');
    assert.strictEqual(allTotal, 100, 'ALL preset totals 100 min');
    assert.ok(allTotal <= 120, 'ALL preset within 120 min ceiling');

    // Preset DSA+HLD
    const dsaHldTotal = calculateCustomTotal(CUSTOM_PRESETS.DSA_HLD);
    assert.strictEqual(CUSTOM_PRESETS.DSA_HLD.length, 2, 'DSA_HLD selects 2 domains');
    assert.strictEqual(dsaHldTotal, 60, 'DSA_HLD totals 60 min');
    assert.ok(dsaHldTotal <= 120, 'DSA_HLD preset within 120 min ceiling');

    // Preset DSA+LLD
    const dsaLldTotal = calculateCustomTotal(CUSTOM_PRESETS.DSA_LLD);
    assert.strictEqual(CUSTOM_PRESETS.DSA_LLD.length, 2, 'DSA_LLD selects 2 domains');
    assert.strictEqual(dsaLldTotal, 60, 'DSA_LLD totals 60 min');
    assert.ok(dsaLldTotal <= 120, 'DSA_LLD preset within 120 min ceiling');
  });

  test('Total duration ceiling check: sums exceeding 120 min are flagged as over-limit', () => {
    const validConfig: CustomDomainConfig[] = [
      { domain: 'ALGORITHMS_DATA_STRUCTURES', durationMinutes: 50 },
      { domain: 'SYSTEM_DESIGN', durationMinutes: 50 }
    ];
    assert.strictEqual(calculateCustomTotal(validConfig) <= 120, true, '100 min is valid');

    const overflowConfig: CustomDomainConfig[] = [
      { domain: 'ALGORITHMS_DATA_STRUCTURES', durationMinutes: 60 },
      { domain: 'SYSTEM_DESIGN', durationMinutes: 60 },
      { domain: 'SQL', durationMinutes: 15 }
    ];
    const overflowTotal = calculateCustomTotal(overflowConfig);
    assert.strictEqual(overflowTotal, 135, 'Total is 135 min');
    assert.strictEqual(overflowTotal > 120, true, '135 min correctly flagged as exceeding 120 min ceiling');
  });

  test('formatCustomPlanPreview produces human-readable plan line', () => {
    const emptyPreview = formatCustomPlanPreview([]);
    assert.strictEqual(emptyPreview, 'Select at least one domain');

    const customDomains: CustomDomainConfig[] = [
      { domain: 'ALGORITHMS_DATA_STRUCTURES', durationMinutes: 30 },
      { domain: 'SYSTEM_DESIGN', durationMinutes: 30 }
    ];
    const preview = formatCustomPlanPreview(customDomains);
    assert.strictEqual(preview, 'DSA (30m) · HLD (30m) · ≈60 min');

    const allDomains: CustomDomainConfig[] = [
      { domain: 'ALGORITHMS_DATA_STRUCTURES', durationMinutes: 20 },
      { domain: 'SPRING_LLD', durationMinutes: 20 },
      { domain: 'SYSTEM_DESIGN', durationMinutes: 20 },
      { domain: 'SQL', durationMinutes: 20 },
      { domain: 'RESUME_BASED', durationMinutes: 20 }
    ];
    const allPreview = formatCustomPlanPreview(allDomains);
    assert.strictEqual(allPreview, 'DSA (20m) · LLD (20m) · HLD (20m) · SQL (20m) · Others (20m) · ≈100 min');
  });

  test('getPlanPreset supports CUSTOM track fallback with valid preview', () => {
    const preset = getPlanPreset('CUSTOM', 'MID');
    assert.ok(preset.preview.includes('≈60 min'));
    assert.strictEqual(preset.plannedTotalMinutes, 60);
  });
});
