export interface CalendarCell {
  day: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  disabled: boolean;
  isPadding?: boolean;
}

export interface MonthLabel {
  label: string;
  colIndex: number;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

export function getIsoWeekday(dayKey: string): number {
  const parts = dayKey.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const adjY = m < 3 ? y - 1 : y;
  const dow = (adjY + Math.floor(adjY / 4) - Math.floor(adjY / 100) + Math.floor(adjY / 400) + t[m - 1] + d) % 7;
  return (dow + 6) % 7;
}

export function nextDayKey(dayKey: string): string {
  const parts = dayKey.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const daysInMonth = [0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (d < daysInMonth[m]) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
  } else if (m < 12) {
    return `${y}-${String(m + 1).padStart(2, '0')}-01`;
  } else {
    return `${y + 1}-01-01`;
  }
}

export function buildCalendarGrid(
  solvedByDay: Record<string, number>,
  fromDay: string,
  toDay: string,
  todayStr?: string
): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const startWeekday = getIsoWeekday(fromDay);

  for (let i = 0; i < startWeekday; i++) {
    cells.push({
      day: '',
      count: 0,
      level: 0,
      disabled: true,
      isPadding: true,
    });
  }

  let curr = fromDay;
  while (curr <= toDay) {
    const count = solvedByDay[curr] ?? 0;
    const isFuture = todayStr ? curr > todayStr : false;
    cells.push({
      day: curr,
      count,
      level: levelFor(count),
      disabled: isFuture,
      isPadding: false,
    });
    if (curr === toDay) break;
    curr = nextDayKey(curr);
  }

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const trailingPads = 7 - remainder;
    for (let i = 0; i < trailingPads; i++) {
      cells.push({
        day: '',
        count: 0,
        level: 0,
        disabled: true,
        isPadding: true,
      });
    }
  }

  return cells;
}

export function monthLabels(cells: CalendarCell[]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  const seenMonths = new Set<string>();

  for (let idx = 0; idx < cells.length; idx++) {
    const cell = cells[idx];
    if (cell.isPadding || !cell.day) continue;

    const colIndex = Math.floor(idx / 7);
    const yearMonth = cell.day.slice(0, 7);
    const month = parseInt(cell.day.slice(5, 7), 10);

    if (!seenMonths.has(yearMonth)) {
      seenMonths.add(yearMonth);
      const targetCol =
        labels.length > 0 && labels[labels.length - 1].colIndex === colIndex
          ? colIndex + 1
          : colIndex;
      labels.push({
        label: MONTH_NAMES[month - 1],
        colIndex: targetCol,
      });
    }
  }

  return labels;
}
