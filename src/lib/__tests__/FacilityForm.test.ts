import { previewCancellationsForFacilityEdit } from '../FacilityForm';
import { getUpcomingBookingsForFacility } from '@/lib/bookings';
import type { Facility } from '@/types/facility';
import type { Booking } from '@/types/booking';
import type { FacilityForm } from '@/lib/schemas/facilityFormSchema';

// Mock every external dependency so only the pure cancellation logic is exercised.
// The real getDayFromDate / parseTimeToMins from slots.ts are intentionally NOT mocked —
// the logic under test depends on them being correct.
jest.mock('@/lib/bookings', () => ({ getUpcomingBookingsForFacility: jest.fn() }));
jest.mock('@/lib/bookingRequests', () => ({
    cancelBookingRequestsForFacility: jest.fn(),
    getBookingRequestsForFacility: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/users', () => ({ getUsersByIds: jest.fn().mockResolvedValue([]) }));
jest.mock('@/lib/notifications', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn(), updateDoc: jest.fn().mockResolvedValue(undefined) }));

const mockGetBookings = getUpcomingBookingsForFacility as jest.Mock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseHours = {
    monday:    { open: '08:00', close: '20:00' },
    tuesday:   { open: '08:00', close: '20:00' },
    wednesday: { open: '08:00', close: '20:00' },
    thursday:  { open: '08:00', close: '20:00' },
    friday:    { open: '08:00', close: '20:00' },
    saturday:  { open: '09:00', close: '17:00' },
    sunday:    null,
};

const currentFacility: Facility = {
    id: 'fac-1',
    name: 'Tennis Court',
    category: 'tennis',
    description: '',
    usageGuidelines: [],
    location: 'Block A',
    maxCapacity: 3,
    openingHours: baseHours,
    slotDurationMins: 60,
    isActive: true,
    assignedStaffIds: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
};

// A FacilityForm that is identical to currentFacility - a no-op edit
const noChangeForm: FacilityForm = {
    name: 'Tennis Court',
    category: 'tennis',
    description: '',
    location: 'Block A',
    maxCapacity: 3,
    slotDurationMins: 60,
    openingHours: baseHours,
    usageGuidelines: [],
    isActive: true,
    assignedStaffIds: [],
};

// 2026-05-04 is a Monday - chosen so getDayFromDate returns 'monday' reliably
const MONDAY = '2026-05-04';

function makeBooking(overrides: Partial<Booking>): Booking {
    return {
        id: 'b-1',
        memberId: 'member-1',
        memberName: 'Alice',
        memberEmail: 'alice@example.com',
        facilityId: 'fac-1',
        facilityName: 'Tennis Court',
        activityDescription: 'Tennis',
        status: 'upcoming',
        date: MONDAY,
        slotStart: 480,  // 08:00
        slotEnd: 540,    // 09:00
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
        ...overrides,
    };
}

afterEach(() => { jest.clearAllMocks(); });

// ─── No bookings ──────────────────────────────────────────────────────────────

describe('when there are no upcoming bookings', () => {
    test('returns 0 regardless of the proposed change', async () => {
        mockGetBookings.mockResolvedValue([]);
        const next = { ...noChangeForm, isActive: false };
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(0);
    });
});

// ─── Deactivation ─────────────────────────────────────────────────────────────

describe('deactivation (isActive: false)', () => {
    test('cancels every upcoming booking', async () => {
        mockGetBookings.mockResolvedValue([
            makeBooking({ id: 'b-1' }),
            makeBooking({ id: 'b-2' }),
            makeBooking({ id: 'b-3' }),
        ]);
        const next = { ...noChangeForm, isActive: false };
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(3);
    });

    test('cancels a single booking', async () => {
        mockGetBookings.mockResolvedValue([makeBooking({ id: 'b-1' })]);
        const next = { ...noChangeForm, isActive: false };
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(1);
    });
});

// ─── Opening hours change ─────────────────────────────────────────────────────

describe('opening hours narrowed', () => {
    test('cancels a booking whose slot start is before the new opening time', async () => {
        // Booking at 08:00–09:00, new Monday hours start at 09:00
        mockGetBookings.mockResolvedValue([makeBooking({ slotStart: 480, slotEnd: 540 })]);
        const next = {
            ...noChangeForm,
            openingHours: { ...baseHours, monday: { open: '09:00', close: '20:00' } },
        };
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(1);
    });

    test('cancels a booking whose slot end is after the new closing time', async () => {
        // Booking at 19:00–20:00, new Monday hours close at 19:00
        mockGetBookings.mockResolvedValue([makeBooking({ slotStart: 1140, slotEnd: 1200 })]);
        const next = {
            ...noChangeForm,
            openingHours: { ...baseHours, monday: { open: '08:00', close: '19:00' } },
        };
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(1);
    });

    test('cancels a booking when the day is set to closed (null)', async () => {
        mockGetBookings.mockResolvedValue([makeBooking({ date: MONDAY })]);
        const next = {
            ...noChangeForm,
            openingHours: { ...baseHours, monday: null },
        };
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(1);
    });

    test('does not cancel a booking that still fits within the new hours', async () => {
        // Booking at 10:00–11:00, new Monday hours 09:00–20:00
        mockGetBookings.mockResolvedValue([makeBooking({ slotStart: 600, slotEnd: 660 })]);
        const next = {
            ...noChangeForm,
            openingHours: { ...baseHours, monday: { open: '09:00', close: '20:00' } },
        };
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(0);
    });

    test('cancels only the bookings that fall outside the new hours', async () => {
        // One booking outside (07:00–08:00 → before new open 08:00), two inside
        mockGetBookings.mockResolvedValue([
            makeBooking({ id: 'outside', slotStart: 420, slotEnd: 480 }), // 07:00–08:00
            makeBooking({ id: 'inside-1', slotStart: 540, slotEnd: 600 }),
            makeBooking({ id: 'inside-2', slotStart: 600, slotEnd: 660 }),
        ]);
        const next = {
            ...noChangeForm,
            openingHours: { ...baseHours, monday: { open: '08:00', close: '20:00' } },
        };
        // 07:00 start < 08:00 open → cancelled; the others fit
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(1);
    });
});

// ─── Capacity reduction ───────────────────────────────────────────────────────

describe('capacity reduction', () => {
    test('cancels excess bookings on an over-loaded slot, keeping the oldest', async () => {
        // 3 bookings at the same slot, capacity reduced to 1 → 2 newest cancelled
        mockGetBookings.mockResolvedValue([
            makeBooking({ id: 'b-1', createdAt: '2026-05-01T10:00:00Z' }), // oldest — kept
            makeBooking({ id: 'b-2', createdAt: '2026-05-01T11:00:00Z' }), // cancelled
            makeBooking({ id: 'b-3', createdAt: '2026-05-01T12:00:00Z' }), // cancelled
        ]);
        const next = { ...noChangeForm, maxCapacity: 1 };
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(2);
    });

    test('does not cancel anything when the slot count stays within capacity', async () => {
        // 2 bookings on different slots, capacity reduced to 1 → no slot is over-capacity
        mockGetBookings.mockResolvedValue([
            makeBooking({ id: 'b-1', slotStart: 480, slotEnd: 540 }), // slot A
            makeBooking({ id: 'b-2', slotStart: 540, slotEnd: 600 }), // slot B
        ]);
        const next = { ...noChangeForm, maxCapacity: 1 };
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(0);
    });

    test('does not cancel anything if capacity is unchanged', async () => {
        mockGetBookings.mockResolvedValue([
            makeBooking({ id: 'b-1' }),
            makeBooking({ id: 'b-2' }),
        ]);
        const next = { ...noChangeForm }; // maxCapacity = 3, unchanged
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(0);
    });
});

// ─── Slot duration change ─────────────────────────────────────────────────────

describe('slot duration change', () => {
    test('does not cancel a booking that aligns with the new slot grid', async () => {
        // Old: 60 min. New: 30 min. Booking at 08:00–08:30 fits new 30-min grid.
        // Capacity = 3 so no overflow.
        mockGetBookings.mockResolvedValue([
            makeBooking({ slotStart: 480, slotEnd: 510 }), // 08:00–08:30
        ]);
        const next = { ...noChangeForm, slotDurationMins: 30 };
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(0);
    });

    test('cancels over-capacity bookings that overlap the same new slot', async () => {
        // Old: 60-min slots at 480-540, 480-540, 480-540 (3 bookings, capacity 3).
        // New: 90-min slots. Slot [480,570] overlaps all three 480-540 bookings.
        // Capacity reduced to 1 → 2 cancelled.
        mockGetBookings.mockResolvedValue([
            makeBooking({ id: 'b-1', slotStart: 480, slotEnd: 540, createdAt: '2026-05-01T10:00:00Z' }),
            makeBooking({ id: 'b-2', slotStart: 480, slotEnd: 540, createdAt: '2026-05-01T11:00:00Z' }),
            makeBooking({ id: 'b-3', slotStart: 480, slotEnd: 540, createdAt: '2026-05-01T12:00:00Z' }),
        ]);
        const next = { ...noChangeForm, slotDurationMins: 90, maxCapacity: 1 };
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(2);
    });
});

// ─── Mixed changes ────────────────────────────────────────────────────────────

describe('mixed changes', () => {
    test('combines hours-violation cancellations with capacity-overflow cancellations', async () => {
        // Booking A: outside new hours → cancelled by hours check
        // Bookings B, C, D: same slot, capacity reduced to 1 → 2 newest cancelled
        // Total: 1 + 2 = 3
        mockGetBookings.mockResolvedValue([
            makeBooking({ id: 'outside', slotStart: 420, slotEnd: 480 }), // 07:00–08:00, before new open
            makeBooking({ id: 'b-1', slotStart: 540, slotEnd: 600, createdAt: '2026-05-01T10:00:00Z' }),
            makeBooking({ id: 'b-2', slotStart: 540, slotEnd: 600, createdAt: '2026-05-01T11:00:00Z' }),
            makeBooking({ id: 'b-3', slotStart: 540, slotEnd: 600, createdAt: '2026-05-01T12:00:00Z' }),
        ]);
        const next = {
            ...noChangeForm,
            maxCapacity: 1,
            openingHours: { ...baseHours, monday: { open: '08:00', close: '20:00' } }, // unchanged from base
        };
        // 07:00–08:00 slot start (420) < open (480) → outside
        // B, C, D on slot 540-600, capacity 1 → 2 cancelled
        expect(await previewCancellationsForFacilityEdit('fac-1', currentFacility, next)).toBe(3);
    });
});
