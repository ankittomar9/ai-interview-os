import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  levelFor,
  getIsoWeekday,
  nextDayKey,
  buildCalendarGrid,
  monthLabels,
} from './calendarGrid.js';

describe('ActivityHeatmap calendarGrid lib', () => {
  it('levelFor: verifies fixed threshold boundaries', () => {
    assert.strictEqual(levelFor(0), 0);
    assert.strictEqual(levelFor(-1), 0);
    assert.strictEqual(levelFor(1), 1);
    assert.strictEqual(levelFor(2), 1);
    assert.strictEqual(levelFor(3), 2);
    assert.strictEqual(levelFor(5), 2);
    assert.strictEqual(levelFor(6), 3);
    assert.strictEqual(levelFor(9), 3);
    assert.strictEqual(levelFor(10), 4);
    assert.strictEqual(levelFor(25), 4);
  });

  it('getIsoWeekday and nextDayKey: pure date arithmetic', () => {
    // 2026-10-12 is Monday (0)
    assert.strictEqual(getIsoWeekday('2026-10-12'), 0);
    // 2026-10-14 is Wednesday (2)
    assert.strictEqual(getIsoWeekday('2026-10-14'), 2);
    // 2026-10-18 is Sunday (6)
    assert.strictEqual(getIsoWeekday('2026-10-18'), 6);

    assert.strictEqual(nextDayKey('2026-10-14'), '2026-10-15');
    assert.strictEqual(nextDayKey('2026-10-31'), '2026-11-01');
    assert.strictEqual(nextDayKey('2026-12-31'), '2027-01-01');
    assert.strictEqual(nextDayKey('2024-02-28'), '2024-02-29'); // Leap year
    assert.strictEqual(nextDayKey('2023-02-28'), '2023-03-01'); // Non-leap year
  });

  it('buildCalendarGrid: exact cell array for a known 3-week window with leading and trailing padding', () => {
    // 2026-10-14 is Wednesday (ISO 2). So leading pad = 2 (Monday, Tuesday).
    // 2026-10-27 is Tuesday (ISO 1).
    // Days: 14 total days. Total with 2 leading pads = 16.
    // 16 % 7 = 2 remainder -> trailing pads = 5.
    // Total cells = 2 + 14 + 5 = 21 (exactly 3 weeks = 21 cells).
    const fromDay = '2026-10-14';
    const toDay = '2026-10-27';
    const solvedMap: Record<string, number> = {
      '2026-10-14': 4,
      '2026-10-20': 12,
    };

    const cells = buildCalendarGrid(solvedMap, fromDay, toDay);
    assert.strictEqual(cells.length, 21);

    // Leading padding
    assert.strictEqual(cells[0].isPadding, true);
    assert.strictEqual(cells[1].isPadding, true);

    // First real day: 2026-10-14
    assert.strictEqual(cells[2].day, '2026-10-14');
    assert.strictEqual(cells[2].count, 4);
    assert.strictEqual(cells[2].level, 2);
    assert.strictEqual(cells[2].disabled, false);

    // Day with 12 solves: level 4
    const oct20Index = cells.findIndex((c) => c.day === '2026-10-20');
    assert.strictEqual(cells[oct20Index].count, 12);
    assert.strictEqual(cells[oct20Index].level, 4);

    // Trailing padding: last 5 cells
    for (let i = 16; i < 21; i++) {
      assert.strictEqual(cells[i].isPadding, true);
      assert.strictEqual(cells[i].day, '');
    }
  });

  it('buildCalendarGrid: empty map yields all-zero cells without error', () => {
    const cells = buildCalendarGrid({}, '2026-10-12', '2026-10-18');
    assert.strictEqual(cells.length, 7);
    for (const cell of cells) {
      assert.strictEqual(cell.count, 0);
      assert.strictEqual(cell.level, 0);
    }
  });

  it('buildCalendarGrid: future cells marked disabled', () => {
    const today = '2026-10-14';
    const cells = buildCalendarGrid({}, '2026-10-12', '2026-10-18', today);
    const oct14 = cells.find((c) => c.day === '2026-10-14');
    const oct15 = cells.find((c) => c.day === '2026-10-15');
    assert.strictEqual(oct14?.disabled, false);
    assert.strictEqual(oct15?.disabled, true);
  });

  it('monthLabels: returns labels at first column of each new month', () => {
    // Oct 28 to Nov 10 spanning month change
    const cells = buildCalendarGrid({}, '2026-10-26', '2026-11-08');
    const labels = monthLabels(cells);
    assert.strictEqual(labels.length, 2);
    assert.strictEqual(labels[0].label, 'Oct');
    assert.strictEqual(labels[0].colIndex, 0);
    assert.strictEqual(labels[1].label, 'Nov');
    assert.strictEqual(labels[1].colIndex, 1);
  });
});
