import {
    getDayFromDate,
    parseTimeToMins,
    getSlotsForFacilityDate,
    getNext7Dates,
    getTotalSlots,
    availabilityCategory,
} from '../slots';
import type { Facility } from '@/types/facility';

// ─── Fixture ──────────────────────────────────────────────────────────────────

function makeFacility(overrides: Partial<Facility> = {}): Facility {
    return {
        id: 'fac-1',
        name: 'Tennis Court',
        category: 'tennis',
        description: '',
        usageGuidelines: [],
        location: 'Block A',
        maxCapacity: 2,
        openingHours: {
            monday:    { open: '08:00', close: '20:00' },
            tuesday:   { open: '08:00', close: '20:00' },
            wednesday: { open: '08:00', close: '20:00' },
            thursday:  { open: '08:00', close: '20:00' },
            friday:    { open: '08:00', close: '20:00' },
            saturday:  { open: '09:00', close: '17:00' },
            sunday:    null,
        },
        slotDurationMins: 60,
        isActive: true,
        assignedStaffIds: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}

// ─── getDayFromDate ───────────────────────────────────────────────────────────
// May 4–10 2026 covers Mon–Sun (May 8 2026 is a known Friday)

describe('getDayFromDate', () => {
    test('returns "monday" for 2026-05-04', () => {
        expect(getDayFromDate('2026-05-04')).toBe('monday');
    });

    test('returns "tuesday" for 2026-05-05', () => {
        expect(getDayFromDate('2026-05-05')).toBe('tuesday');
    });

    test('returns "wednesday" for 2026-05-06', () => {
        expect(getDayFromDate('2026-05-06')).toBe('wednesday');
    });

    test('returns "thursday" for 2026-05-07', () => {
        expect(getDayFromDate('2026-05-07')).toBe('thursday');
    });

    test('returns "friday" for 2026-05-08', () => {
        expect(getDayFromDate('2026-05-08')).toBe('friday');
    });

    test('returns "saturday" for 2026-05-09', () => {
        expect(getDayFromDate('2026-05-09')).toBe('saturday');
    });

    test('returns "sunday" for 2026-05-10', () => {
        expect(getDayFromDate('2026-05-10')).toBe('sunday');
    });

    test('handles a year boundary (2026-12-31 is a Thursday)', () => {
        expect(getDayFromDate('2026-12-31')).toBe('thursday');
    });
});

// ─── parseTimeToMins ──────────────────────────────────────────────────────────

describe('parseTimeToMins', () => {
    test('converts "00:00" to 0', () => {
        expect(parseTimeToMins('00:00')).toBe(0);
    });

    test('converts "08:00" to 480', () => {
        expect(parseTimeToMins('08:00')).toBe(480);
    });

    test('converts "09:30" to 570', () => {
        expect(parseTimeToMins('09:30')).toBe(570);
    });

    test('converts "12:00" to 720', () => {
        expect(parseTimeToMins('12:00')).toBe(720);
    });

    test('converts "17:45" to 1065', () => {
        expect(parseTimeToMins('17:45')).toBe(1065);
    });

    test('converts "23:59" to 1439', () => {
        expect(parseTimeToMins('23:59')).toBe(1439);
    });
});

// ─── getSlotsForFacilityDate ──────────────────────────────────────────────────

describe('getSlotsForFacilityDate', () => {
    test('returns [] for an empty date string', () => {
        expect(getSlotsForFacilityDate(makeFacility(), '')).toEqual([]);
    });

    test('returns [] for a day the facility is closed (Sunday)', () => {
        // 2026-05-10 is a Sunday, openingHours.sunday is null
        expect(getSlotsForFacilityDate(makeFacility(), '2026-05-10')).toEqual([]);
    });

    test('generates the correct slots for a standard weekday (08:00–20:00, 60 min)', () => {
        // 08:00–20:00 = 12 hours → 12 slots: 480, 540, ..., 1140
        const slots = getSlotsForFacilityDate(makeFacility(), '2026-05-04'); // Monday
        expect(slots).toHaveLength(12);
        expect(slots[0]).toBe(480);   // 08:00
        expect(slots[11]).toBe(1140); // 19:00 (last slot ends at 20:00)
    });

    test('generates the correct slots for Saturday (09:00–17:00, 60 min)', () => {
        // 09:00–17:00 = 8 hours → 8 slots: 540, 600, ..., 960
        const slots = getSlotsForFacilityDate(makeFacility(), '2026-05-09'); // Saturday
        expect(slots).toHaveLength(8);
        expect(slots[0]).toBe(540);  // 09:00
        expect(slots[7]).toBe(960);  // 16:00 (last slot ends at 17:00)
    });

    test('respects a 90-minute slot duration', () => {
        const facility = makeFacility({
            openingHours: { ...makeFacility().openingHours, monday: { open: '09:00', close: '12:00' } },
            slotDurationMins: 90,
        });
        // 09:00–12:00 = 180 mins, 90-min slots → [540, 630]
        const slots = getSlotsForFacilityDate(facility, '2026-05-04'); // Monday
        expect(slots).toEqual([540, 630]);
    });

    test('returns [] when the slot duration does not fit in the opening window', () => {
        const facility = makeFacility({
            openingHours: { ...makeFacility().openingHours, monday: { open: '09:00', close: '09:30' } },
            slotDurationMins: 60,
        });
        expect(getSlotsForFacilityDate(facility, '2026-05-04')).toEqual([]);
    });

    test('includes a slot that ends exactly at closing time', () => {
        // 08:00–10:00, 60 min → [480, 540] — slot at 540 ends at 600 (10:00) ✓
        const facility = makeFacility({
            openingHours: { ...makeFacility().openingHours, monday: { open: '08:00', close: '10:00' } },
        });
        expect(getSlotsForFacilityDate(facility, '2026-05-04')).toEqual([480, 540]);
    });

    test('slots are evenly spaced by the slot duration', () => {
        const slots = getSlotsForFacilityDate(makeFacility(), '2026-05-04');
        for (let i = 1; i < slots.length; i++) {
            expect(slots[i] - slots[i - 1]).toBe(60);
        }
    });
});

// ─── getNext7Dates ────────────────────────────────────────────────────────────

describe('getNext7Dates', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    test('always returns exactly 7 dates', () => {
        jest.setSystemTime(new Date('2026-05-08T10:00:00.000Z'));
        expect(getNext7Dates()).toHaveLength(7);
    });

    test('starts from today', () => {
        jest.setSystemTime(new Date('2026-05-08T10:00:00.000Z'));
        expect(getNext7Dates()[0]).toBe('2026-05-08');
    });

    test('returns consecutive dates from today', () => {
        jest.setSystemTime(new Date('2026-05-08T10:00:00.000Z'));
        expect(getNext7Dates()).toEqual([
            '2026-05-08', '2026-05-09', '2026-05-10',
            '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14',
        ]);
    });

    test('wraps correctly across a month boundary', () => {
        jest.setSystemTime(new Date('2026-05-28T10:00:00.000Z'));
        const dates = getNext7Dates();
        expect(dates[3]).toBe('2026-05-31');
        expect(dates[4]).toBe('2026-06-01');
    });

    test('wraps correctly across a year boundary', () => {
        jest.setSystemTime(new Date('2026-12-29T10:00:00.000Z'));
        const dates = getNext7Dates();
        expect(dates[2]).toBe('2026-12-31');
        expect(dates[3]).toBe('2027-01-01');
    });

    test('all dates are in YYYY-MM-DD format', () => {
        jest.setSystemTime(new Date('2026-05-08T10:00:00.000Z'));
        for (const d of getNext7Dates()) {
            expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
    });
});

// ─── getTotalSlots ────────────────────────────────────────────────────────────

describe('getTotalSlots', () => {
    test('returns 0 for an empty dates array', () => {
        expect(getTotalSlots(makeFacility(), [])).toBe(0);
    });

    test('returns 0 for a single closed day', () => {
        expect(getTotalSlots(makeFacility(), ['2026-05-10'])).toBe(0); // Sunday
    });

    test('counts slots for a single weekday correctly', () => {
        // Mon 08:00–20:00, 60 min → 12 slots
        expect(getTotalSlots(makeFacility(), ['2026-05-04'])).toBe(12);
    });

    test('counts slots for a Saturday correctly', () => {
        // Sat 09:00–17:00, 60 min → 8 slots
        expect(getTotalSlots(makeFacility(), ['2026-05-09'])).toBe(8);
    });

    test('sums slots across multiple days, skipping closed days', () => {
        // Mon(12) + Sat(8) + Sun(0) = 20
        expect(getTotalSlots(makeFacility(), ['2026-05-04', '2026-05-09', '2026-05-10'])).toBe(20);
    });

    test('is consistent with getSlotsForFacilityDate', () => {
        const dates = ['2026-05-04', '2026-05-05', '2026-05-06'];
        const expected = dates.reduce(
            (sum, d) => sum + getSlotsForFacilityDate(makeFacility(), d).length,
            0,
        );
        expect(getTotalSlots(makeFacility(), dates)).toBe(expected);
    });

    test('respects a non-default slot duration', () => {
        const facility = makeFacility({ slotDurationMins: 90 });
        // Mon 08:00–20:00 = 720 mins, 90-min slots → floor(720/90) = 8 slots
        expect(getTotalSlots(facility, ['2026-05-04'])).toBe(8);
    });
});

// ─── availabilityCategory ─────────────────────────────────────────────────────

describe('availabilityCategory', () => {
    test('returns "Closed" when total is 0', () => {
        expect(availabilityCategory(0, 0)).toEqual({ label: 'Closed', colour: 'bg-slate-100 text-slate-500' });
    });

    test('returns "High" when booked fraction is 0%', () => {
        expect(availabilityCategory(0, 10)).toEqual({ label: 'High', colour: 'bg-green-100 text-green-700' });
    });

    test('returns "High" when booked fraction is under 30%', () => {
        expect(availabilityCategory(2, 10)).toEqual({ label: 'High', colour: 'bg-green-100 text-green-700' });
    });

    test('returns "Medium" at exactly the 30% boundary', () => {
        expect(availabilityCategory(3, 10)).toEqual({ label: 'Medium', colour: 'bg-amber-100 text-amber-700' });
    });

    test('returns "Medium" when booked fraction is between 30% and 70%', () => {
        expect(availabilityCategory(6, 10)).toEqual({ label: 'Medium', colour: 'bg-amber-100 text-amber-700' });
    });

    test('returns "Low" at exactly the 70% boundary', () => {
        expect(availabilityCategory(7, 10)).toEqual({ label: 'Low', colour: 'bg-red-100 text-red-700' });
    });

    test('returns "Low" when fully booked', () => {
        expect(availabilityCategory(10, 10)).toEqual({ label: 'Low', colour: 'bg-red-100 text-red-700' });
    });
});
