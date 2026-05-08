import {
    formatDate,
    formatDateTime,
    formatRelativeTime,
    formatSlot,
    getMinBookingDate,
    getMaxBookingDate,
} from '../date';

// ─── formatSlot ───────────────────────────────────────────────────────────────

describe('formatSlot', () => {
    test('formats a morning slot', () => {
        expect(formatSlot(480, 60)).toBe('8:00 AM - 9:00 AM');
    });

    test('formats an afternoon slot with non-zero minutes', () => {
        expect(formatSlot(780, 90)).toBe('1:00 PM - 2:30 PM');
    });

    test('handles midnight start', () => {
        expect(formatSlot(0, 60)).toBe('12:00 AM - 1:00 AM');
    });

    test('handles noon start', () => {
        expect(formatSlot(720, 60)).toBe('12:00 PM - 1:00 PM');
    });

    test('handles a slot starting at 11:30 PM that crosses midnight', () => {
        expect(formatSlot(1410, 60)).toBe('11:30 PM - 12:30 AM');
    });

    test('pads minutes with leading zero', () => {
        expect(formatSlot(545, 30)).toBe('9:05 AM - 9:35 AM');
    });
});

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
    test('contains the year', () => {
        expect(formatDate('2026-05-03')).toContain('2026');
    });

    test('contains the month name', () => {
        expect(formatDate('2026-05-03')).toContain('May');
    });

    test('contains the day', () => {
        expect(formatDate('2026-05-03')).toContain('3');
    });

    test('formats a January date correctly', () => {
        const result = formatDate('2026-01-15');
        expect(result).toContain('Jan');
        expect(result).toContain('2026');
    });

    test('formats a December date correctly', () => {
        const result = formatDate('2026-12-31');
        expect(result).toContain('Dec');
        expect(result).toContain('31');
    });

    test('includes a weekday abbreviation', () => {
        // 2026-05-03 is a Sunday
        expect(formatDate('2026-05-03')).toContain('Sun');
    });
});

// ─── formatDateTime ───────────────────────────────────────────────────────────

describe('formatDateTime', () => {
    test('contains the year', () => {
        expect(formatDateTime('2026-05-03T00:00:00.000Z')).toContain('2026');
    });

    test('contains the month name', () => {
        expect(formatDateTime('2026-05-03T00:00:00.000Z')).toContain('May');
    });

    test('contains hours and minutes in HH:MM format', () => {
        expect(formatDateTime('2026-05-03T14:30:00.000Z')).toMatch(/\d{1,2}:\d{2}/);
    });

    test('displays midnight as 00:00', () => {
        expect(formatDateTime('2026-05-03T00:00:00.000Z')).toMatch(/00:00/);
    });
});

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
    const BASE = new Date('2026-05-08T12:00:00.000Z').getTime();

    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    test('returns "just now" for timestamps under 1 minute ago', () => {
        jest.setSystemTime(BASE);
        expect(formatRelativeTime(new Date(BASE - 30_000).toISOString())).toBe('just now');
    });

    test('returns "just now" for the current moment', () => {
        jest.setSystemTime(BASE);
        expect(formatRelativeTime(new Date(BASE).toISOString())).toBe('just now');
    });

    test('returns minutes ago for timestamps between 1 and 59 minutes ago', () => {
        jest.setSystemTime(BASE);
        expect(formatRelativeTime(new Date(BASE - 5 * 60_000).toISOString())).toBe('5m ago');
        expect(formatRelativeTime(new Date(BASE - 59 * 60_000).toISOString())).toBe('59m ago');
    });

    test('returns hours ago for timestamps between 1 and 23 hours ago', () => {
        jest.setSystemTime(BASE);
        expect(formatRelativeTime(new Date(BASE - 2 * 60 * 60_000).toISOString())).toBe('2h ago');
        expect(formatRelativeTime(new Date(BASE - 23 * 60 * 60_000).toISOString())).toBe('23h ago');
    });

    test('returns days ago for timestamps between 1 and 6 days ago', () => {
        jest.setSystemTime(BASE);
        expect(formatRelativeTime(new Date(BASE - 3 * 24 * 60 * 60_000).toISOString())).toBe('3d ago');
        expect(formatRelativeTime(new Date(BASE - 6 * 24 * 60 * 60_000).toISOString())).toBe('6d ago');
    });

    test('returns a formatted date string for timestamps 7+ days ago', () => {
        jest.setSystemTime(BASE);
        const sevenDaysAgo = new Date(BASE - 7 * 24 * 60 * 60_000).toISOString();
        const result = formatRelativeTime(sevenDaysAgo);
        expect(result).toContain('2026');
        expect(result).not.toMatch(/ago$/);
    });
});

// ─── getMinBookingDate ────────────────────────────────────────────────────────

describe('getMinBookingDate', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    test('returns today in YYYY-MM-DD format', () => {
        jest.setSystemTime(new Date('2026-05-08T10:00:00.000Z'));
        expect(getMinBookingDate()).toBe('2026-05-08');
    });

    test('returns YYYY-MM-DD format regardless of time of day', () => {
        jest.setSystemTime(new Date('2026-12-31T23:59:00.000Z'));
        expect(getMinBookingDate()).toBe('2026-12-31');
    });
});

// ─── getMaxBookingDate ────────────────────────────────────────────────────────

describe('getMaxBookingDate', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    test('returns exactly 60 days from today in YYYY-MM-DD format', () => {
        jest.setSystemTime(new Date('2026-05-08T10:00:00.000Z'));
        // May 8 + 60 days: +23 days = May 31, +30 days = June 30, +7 days = July 7
        expect(getMaxBookingDate()).toBe('2026-07-07');
    });

    test('handles month and year boundaries', () => {
        jest.setSystemTime(new Date('2026-11-10T10:00:00.000Z'));
        // Nov 10 + 60 days = Jan 9 2027
        expect(getMaxBookingDate()).toBe('2027-01-09');
    });
});
