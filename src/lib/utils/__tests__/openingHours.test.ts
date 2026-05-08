import { getTodayKey, getTodayLabel } from '../openingHours';
import type { OpeningHours } from '@/types/facility';

// May 4–10 2026 covers Mon–Sun (May 8 2026 is a Friday)
const MONDAYS  = '2026-05-04T10:00:00.000Z';
const TUESDAY  = '2026-05-05T10:00:00.000Z';
const WEDNESDAY = '2026-05-06T10:00:00.000Z';
const THURSDAY = '2026-05-07T10:00:00.000Z';
const FRIDAY   = '2026-05-08T10:00:00.000Z';
const SATURDAY = '2026-05-09T10:00:00.000Z';
const SUNDAY   = '2026-05-10T10:00:00.000Z';

const openingHours: OpeningHours = {
    monday:    { open: '08:00', close: '20:00' },
    tuesday:   { open: '09:00', close: '18:00' },
    wednesday: { open: '08:00', close: '20:00' },
    thursday:  { open: '08:00', close: '20:00' },
    friday:    { open: '07:00', close: '22:00' },
    saturday:  { open: '10:00', close: '16:00' },
    sunday:    null,
};

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

// ─── getTodayKey ──────────────────────────────────────────────────────────────

describe('getTodayKey', () => {
    test('returns "monday" on a Monday', () => {
        jest.setSystemTime(new Date(MONDAYS));
        expect(getTodayKey()).toBe('monday');
    });

    test('returns "tuesday" on a Tuesday', () => {
        jest.setSystemTime(new Date(TUESDAY));
        expect(getTodayKey()).toBe('tuesday');
    });

    test('returns "wednesday" on a Wednesday', () => {
        jest.setSystemTime(new Date(WEDNESDAY));
        expect(getTodayKey()).toBe('wednesday');
    });

    test('returns "thursday" on a Thursday', () => {
        jest.setSystemTime(new Date(THURSDAY));
        expect(getTodayKey()).toBe('thursday');
    });

    test('returns "friday" on a Friday', () => {
        jest.setSystemTime(new Date(FRIDAY));
        expect(getTodayKey()).toBe('friday');
    });

    test('returns "saturday" on a Saturday', () => {
        jest.setSystemTime(new Date(SATURDAY));
        expect(getTodayKey()).toBe('saturday');
    });

    test('returns "sunday" on a Sunday', () => {
        jest.setSystemTime(new Date(SUNDAY));
        expect(getTodayKey()).toBe('sunday');
    });
});

// ─── getTodayLabel ────────────────────────────────────────────────────────────

describe('getTodayLabel', () => {
    test('returns formatted open–close range when the facility is open today', () => {
        jest.setSystemTime(new Date(FRIDAY)); // friday: 07:00–22:00
        expect(getTodayLabel(openingHours)).toBe('07:00-22:00');
    });

    test('reflects the correct hours for each day', () => {
        jest.setSystemTime(new Date(TUESDAY)); // tuesday: 09:00–18:00
        expect(getTodayLabel(openingHours)).toBe('09:00-18:00');
    });

    test('returns "Closed today" when the facility has no hours for today', () => {
        jest.setSystemTime(new Date(SUNDAY)); // sunday: null
        expect(getTodayLabel(openingHours)).toBe('Closed today');
    });

    test('returns "Closed today" when all days are null', () => {
        const allClosed: OpeningHours = {
            monday: null, tuesday: null, wednesday: null,
            thursday: null, friday: null, saturday: null, sunday: null,
        };
        jest.setSystemTime(new Date(FRIDAY));
        expect(getTodayLabel(allClosed)).toBe('Closed today');
    });
});
