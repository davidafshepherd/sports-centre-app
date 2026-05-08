import {
    getBookingsForMember,
    getUpcomingBookingsForFacility,
    getBookingsForFacility,
    getBookingsForStaff,
    markBookingComplete,
    cancelBooking,
    cancelBookingsForFacility,
} from '../bookings';
import { collection, doc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { getFacilitiesForStaff } from '@/lib/facilities';
import { createNotification } from '@/lib/notifications';
import type { Booking } from '@/types/booking';

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => 'colRef'),
    doc: jest.fn(() => 'docRef'),
    getDocs: jest.fn(),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn((...args) => args[0]),
    where: jest.fn(() => 'whereClause'),
}));
jest.mock('@/lib/facilities', () => ({ getFacilitiesForStaff: jest.fn() }));
jest.mock('@/lib/notifications', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/utils/date', () => ({ formatDate: (d: string) => d }));

const mockGetDocs   = getDocs   as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockWhere = where as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockGetFacilitiesForStaff = getFacilitiesForStaff as jest.Mock;
const mockCreateNotification = createNotification as jest.Mock;

function makeSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
    return { docs: docs.map(d => ({ id: d.id, data: () => d.data, ref: `ref/${d.id}` })) };
}

function makeBooking(id: string, overrides: Partial<Record<string, unknown>> = {}): { id: string; data: Record<string, unknown> } {
    return {
        id,
        data: {
            memberId: 'member-1',
            memberName: 'Alice',
            memberEmail: 'alice@example.com',
            facilityId: 'fac-1',
            facilityName: 'Tennis Court',
            activityDescription: 'Tennis',
            status: 'upcoming',
            date: '2026-05-10',
            slotStart: 480,
            slotEnd: 540,
            createdAt: '2026-05-01T10:00:00Z',
            updatedAt: '2026-05-01T10:00:00Z',
            ...overrides,
        },
    };
}

afterEach(() => { jest.clearAllMocks(); });

// ─── getBookingsForMember ─────────────────────────────────────────────────────

describe('getBookingsForMember', () => {
    test('queries bookings where memberId matches', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getBookingsForMember('member-1');
        expect(mockWhere).toHaveBeenCalledWith('memberId', '==', 'member-1');
    });

    test('maps documents to { id, ...data() }', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([makeBooking('b-1')]));
        const result = await getBookingsForMember('member-1');
        expect(result[0]).toMatchObject({ id: 'b-1', memberId: 'member-1' });
    });

    test('sorts by date descending', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            makeBooking('b-1', { date: '2026-05-01', slotStart: 480 }),
            makeBooking('b-2', { date: '2026-05-03', slotStart: 480 }),
            makeBooking('b-3', { date: '2026-05-02', slotStart: 480 }),
        ]));
        const result = await getBookingsForMember('member-1');
        expect(result.map(b => b.id)).toEqual(['b-2', 'b-3', 'b-1']);
    });

    test('sorts by slotStart descending when dates are equal', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            makeBooking('b-1', { date: '2026-05-01', slotStart: 480 }),
            makeBooking('b-2', { date: '2026-05-01', slotStart: 600 }),
        ]));
        const result = await getBookingsForMember('member-1');
        expect(result.map(b => b.id)).toEqual(['b-2', 'b-1']);
    });
});

// ─── getUpcomingBookingsForFacility ───────────────────────────────────────────

describe('getUpcomingBookingsForFacility', () => {
    test('queries bookings where facilityId matches', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getUpcomingBookingsForFacility('fac-1');
        expect(mockWhere).toHaveBeenCalledWith('facilityId', '==', 'fac-1');
    });

    test('returns only bookings with status upcoming', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            makeBooking('b-1', { status: 'upcoming'  }),
            makeBooking('b-2', { status: 'cancelled' }),
            makeBooking('b-3', { status: 'completed' }),
        ]));
        const result = await getUpcomingBookingsForFacility('fac-1');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('b-1');
    });

    test('returns empty array when no upcoming bookings exist', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        expect(await getUpcomingBookingsForFacility('fac-1')).toEqual([]);
    });
});

// ─── getBookingsForFacility ───────────────────────────────────────────────────

describe('getBookingsForFacility', () => {
    test('queries bookings by facilityId', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getBookingsForFacility('fac-1', '2026-05-10');
        expect(mockWhere).toHaveBeenCalledWith('facilityId', '==', 'fac-1');
    });

    test('filters by both date and status==upcoming', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            makeBooking('b-1', { date: '2026-05-10', status: 'upcoming'  }),
            makeBooking('b-2', { date: '2026-05-10', status: 'cancelled' }),
            makeBooking('b-3', { date: '2026-05-11', status: 'upcoming'  }),
        ]));
        const result = await getBookingsForFacility('fac-1', '2026-05-10');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('b-1');
    });
});

// ─── getBookingsForStaff ──────────────────────────────────────────────────────

describe('getBookingsForStaff', () => {
    test('returns an empty array when no facilities are assigned', async () => {
        mockGetFacilitiesForStaff.mockResolvedValue([]);
        expect(await getBookingsForStaff('staff-1')).toEqual([]);
        expect(mockGetDocs).not.toHaveBeenCalled();
    });

    test('queries by facilityId in the list of assigned facilities', async () => {
        mockGetFacilitiesForStaff.mockResolvedValue([{ id: 'fac-1' }, { id: 'fac-2' }]);
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getBookingsForStaff('staff-1');
        expect(mockWhere).toHaveBeenCalledWith('facilityId', 'in', ['fac-1', 'fac-2']);
    });

    test('sorts results by date descending', async () => {
        mockGetFacilitiesForStaff.mockResolvedValue([{ id: 'fac-1' }]);
        mockGetDocs.mockResolvedValue(makeSnap([
            makeBooking('b-1', { date: '2026-05-01' }),
            makeBooking('b-2', { date: '2026-05-03' }),
        ]));
        const result = await getBookingsForStaff('staff-1');
        expect(result.map(b => b.id)).toEqual(['b-2', 'b-1']);
    });
});

// ─── markBookingComplete ──────────────────────────────────────────────────────

describe('markBookingComplete', () => {
    const booking = {
        id: 'b-1',
        memberId: 'member-1',
        facilityName: 'Tennis Court',
        date: '2026-05-10',
    } as Booking;

    test('calls doc with the correct booking path', async () => {
        await markBookingComplete('b-1', booking, 'staff-1');
        expect(mockDoc).toHaveBeenCalledWith({}, 'bookings', 'b-1');
    });

    test('calls updateDoc with status=completed and completedBy', async () => {
        await markBookingComplete('b-1', booking, 'staff-1');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            status: 'completed',
            completedBy: 'staff-1',
            updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }));
    });

    test('notifies the member with type booking_completed', async () => {
        await markBookingComplete('b-1', booking, 'staff-1');
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'member-1',
            type: 'booking_completed',
            title: 'Session Completed',
            relatedId: 'b-1',
            relatedType: 'booking',
        }));
    });
});

// ─── cancelBooking ────────────────────────────────────────────────────────────

describe('cancelBooking', () => {
    test('calls doc with the correct booking path', async () => {
        await cancelBooking('b-1');
        expect(mockDoc).toHaveBeenCalledWith({}, 'bookings', 'b-1');
    });

    test('calls updateDoc with status=cancelled', async () => {
        await cancelBooking('b-1');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            status: 'cancelled',
            updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }));
    });

    test('does not send a notification', async () => {
        await cancelBooking('b-1');
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });
});

// ─── cancelBookingsForFacility ────────────────────────────────────────────────

describe('cancelBookingsForFacility', () => {
    test('cancels all upcoming bookings for the facility', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            makeBooking('b-1', { status: 'upcoming' }),
            makeBooking('b-2', { status: 'upcoming' }),
            makeBooking('b-3', { status: 'cancelled' }),
        ]));
        await cancelBookingsForFacility('fac-1', 'maintenance');
        // only the 2 upcoming bookings should be updated
        expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({ status: 'cancelled' }));
    });

    test('sends a booking_cancelled notification for each cancelled booking', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            makeBooking('b-1', { status: 'upcoming', memberId: 'member-1' }),
            makeBooking('b-2', { status: 'upcoming', memberId: 'member-2' }),
        ]));
        await cancelBookingsForFacility('fac-1', 'refurbishment');
        expect(mockCreateNotification).toHaveBeenCalledTimes(2);
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
            type: 'booking_cancelled',
            title: 'Booking Cancelled',
        }));
    });

    test('does nothing when there are no upcoming bookings', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await cancelBookingsForFacility('fac-1', 'reason');
        expect(mockUpdateDoc).not.toHaveBeenCalled();
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });
});
