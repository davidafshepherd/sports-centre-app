import {
    createBookingRequest,
    getBookingRequestsForMember,
    getBookingRequestsForStaff,
    approveBookingRequest,
    rejectBookingRequest,
    confirmBookingSlot,
    suggestAlternative,
    acceptAlternativeSuggestion,
    rejectAlternativeSuggestion,
    cancelBookingRequest,
    getBookingRequestsForFacility,
    cancelBookingRequestsForFacility,
} from '../bookingRequests';
import {
    collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where,
} from 'firebase/firestore';
import { getFacilitiesForStaff, getFacilityById } from '@/lib/facilities';
import { createNotification } from '@/lib/notifications';
import type { BookingRequest } from '@/types/bookingRequest';

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => 'colRef'),
    doc: jest.fn(() => 'docRef'),
    getDocs: jest.fn(),
    addDoc: jest.fn().mockResolvedValue({ id: 'req-new' }),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn((...args) => args[0]),
    where: jest.fn(() => 'whereClause'),
}));
jest.mock('@/lib/facilities', () => ({
    getFacilitiesForStaff: jest.fn(),
    getFacilityById: jest.fn(),
}));
jest.mock('@/lib/notifications', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/utils/date', () => ({
    formatDate: (d: string) => d,
    formatSlot: (start: number, dur: number) => `${start}+${dur}`,
}));

const mockGetDocs   = getDocs   as jest.Mock;
const mockAddDoc    = addDoc    as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockWhere = where as jest.Mock;
const mockGetFacilitiesForStaff = getFacilitiesForStaff as jest.Mock;
const mockGetFacilityById       = getFacilityById       as jest.Mock;
const mockCreateNotification    = createNotification    as jest.Mock;

function makeSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
    return { docs: docs.map(d => ({ id: d.id, data: () => d.data, ref: `ref/${d.id}` })) };
}

const baseRequest: BookingRequest = {
    id: 'req-1',
    memberId: 'member-1',
    memberName: 'Alice',
    memberEmail: 'alice@example.com',
    facilityId: 'fac-1',
    facilityName: 'Tennis Court',
    activityDescription: 'Tennis practice',
    status: 'pending',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
};

afterEach(() => { jest.clearAllMocks(); });

// ─── createBookingRequest ─────────────────────────────────────────────────────

describe('createBookingRequest', () => {
    const inputData = {
        memberId: 'member-1',
        memberName: 'Alice',
        memberEmail: 'alice@example.com',
        facilityId: 'fac-1',
        facilityName: 'Tennis Court',
        activityDescription: 'Practice',
    };

    test('adds the booking request with status=pending', async () => {
        mockGetFacilityById.mockResolvedValue(null);
        await createBookingRequest(inputData);
        expect(mockAddDoc).toHaveBeenCalledWith('colRef', expect.objectContaining({
            status: 'pending',
            ...inputData,
        }));
    });

    test('returns the new request ID', async () => {
        mockGetFacilityById.mockResolvedValue(null);
        const id = await createBookingRequest(inputData);
        expect(id).toBe('req-new');
    });

    test('notifies each assigned staff member when facility has staff', async () => {
        mockGetFacilityById.mockResolvedValue({
            id: 'fac-1',
            assignedStaffIds: ['staff-1', 'staff-2'],
        });
        await createBookingRequest(inputData);
        expect(mockCreateNotification).toHaveBeenCalledTimes(2);
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'staff-1',
            type: 'booking_request_received',
            title: 'New Booking Request',
        }));
    });

    test('sends no notifications when facility has no assigned staff', async () => {
        mockGetFacilityById.mockResolvedValue({ id: 'fac-1', assignedStaffIds: [] });
        await createBookingRequest(inputData);
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    test('sends no notifications when facility is not found', async () => {
        mockGetFacilityById.mockResolvedValue(null);
        await createBookingRequest(inputData);
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });
});

// ─── getBookingRequestsForMember ──────────────────────────────────────────────

describe('getBookingRequestsForMember', () => {
    test('queries by memberId', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getBookingRequestsForMember('member-1');
        expect(mockWhere).toHaveBeenCalledWith('memberId', '==', 'member-1');
    });

    test('sorts by createdAt descending', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'r-1', data: { createdAt: '2026-05-01T10:00:00Z' } },
            { id: 'r-2', data: { createdAt: '2026-05-03T10:00:00Z' } },
        ]));
        const result = await getBookingRequestsForMember('member-1');
        expect(result.map(r => r.id)).toEqual(['r-2', 'r-1']);
    });
});

// ─── getBookingRequestsForStaff ───────────────────────────────────────────────

describe('getBookingRequestsForStaff', () => {
    test('returns empty array when staff has no facilities', async () => {
        mockGetFacilitiesForStaff.mockResolvedValue([]);
        expect(await getBookingRequestsForStaff('staff-1')).toEqual([]);
        expect(mockGetDocs).not.toHaveBeenCalled();
    });

    test('queries by facilityId in the facility list', async () => {
        mockGetFacilitiesForStaff.mockResolvedValue([{ id: 'fac-1' }, { id: 'fac-2' }]);
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getBookingRequestsForStaff('staff-1');
        expect(mockWhere).toHaveBeenCalledWith('facilityId', 'in', ['fac-1', 'fac-2']);
    });

    test('sorts results by createdAt descending', async () => {
        mockGetFacilitiesForStaff.mockResolvedValue([{ id: 'fac-1' }]);
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'r-1', data: { createdAt: '2026-05-01T10:00:00Z' } },
            { id: 'r-2', data: { createdAt: '2026-05-03T10:00:00Z' } },
        ]));
        const result = await getBookingRequestsForStaff('staff-1');
        expect(result.map(r => r.id)).toEqual(['r-2', 'r-1']);
    });
});

// ─── approveBookingRequest ────────────────────────────────────────────────────

describe('approveBookingRequest', () => {
    test('updates status to approved', async () => {
        await approveBookingRequest('req-1', baseRequest, 'staff-1');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            status: 'approved',
            reviewedBy: 'staff-1',
        }));
    });

    test('notifies the member with type booking_approved', async () => {
        await approveBookingRequest('req-1', baseRequest, 'staff-1');
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'member-1',
            type: 'booking_approved',
            title: 'Request Approved',
            relatedId: 'req-1',
        }));
    });
});

// ─── rejectBookingRequest ─────────────────────────────────────────────────────

describe('rejectBookingRequest', () => {
    test('updates status to rejected with reviewNote', async () => {
        await rejectBookingRequest('req-1', baseRequest, 'staff-1', 'Facility unavailable');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            status: 'rejected',
            reviewedBy: 'staff-1',
            reviewNote: 'Facility unavailable',
        }));
    });

    test('notifies the member with type booking_rejected', async () => {
        await rejectBookingRequest('req-1', baseRequest, 'staff-1', 'No slots');
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'member-1',
            type: 'booking_rejected',
            title: 'Booking Declined',
        }));
    });

    test('includes the reason in the notification message when a note is provided', async () => {
        await rejectBookingRequest('req-1', baseRequest, 'staff-1', 'Maintenance work');
        const [payload] = mockCreateNotification.mock.calls[0];
        expect(payload.message).toContain('Maintenance work');
    });

    test('omits Reason from the message when note is empty', async () => {
        await rejectBookingRequest('req-1', baseRequest, 'staff-1', '');
        const [payload] = mockCreateNotification.mock.calls[0];
        expect(payload.message).not.toContain('Reason:');
    });
});

// ─── confirmBookingSlot ───────────────────────────────────────────────────────

describe('confirmBookingSlot', () => {
    test('creates a booking document with correct fields', async () => {
        mockGetFacilityById.mockResolvedValue(null);
        await confirmBookingSlot('req-1', baseRequest, '2026-05-10', 480, 60);
        expect(mockAddDoc).toHaveBeenCalledWith('colRef', expect.objectContaining({
            memberId: 'member-1',
            facilityId: 'fac-1',
            date: '2026-05-10',
            slotStart: 480,
            slotEnd: 540,
            status: 'upcoming',
        }));
    });

    test('deletes the booking request after creating the booking', async () => {
        mockGetFacilityById.mockResolvedValue(null);
        await confirmBookingSlot('req-1', baseRequest, '2026-05-10', 480, 60);
        expect(mockDoc).toHaveBeenCalledWith({}, 'bookingRequests', 'req-1');
        expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });

    test('notifies assigned staff members', async () => {
        mockGetFacilityById.mockResolvedValue({ id: 'fac-1', assignedStaffIds: ['staff-1'] });
        await confirmBookingSlot('req-1', baseRequest, '2026-05-10', 480, 60);
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'staff-1',
            type: 'booking_confirmed_staff',
            title: 'Booking Confirmed',
        }));
    });

    test('sends no staff notifications when facility has no staff', async () => {
        mockGetFacilityById.mockResolvedValue({ id: 'fac-1', assignedStaffIds: [] });
        await confirmBookingSlot('req-1', baseRequest, '2026-05-10', 480, 60);
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });
});

// ─── suggestAlternative ───────────────────────────────────────────────────────

describe('suggestAlternative', () => {
    const suggestion = { facilityId: 'fac-2', facilityName: 'Squash Court', note: 'Try this instead' };

    test('updates status to alternative_suggested', async () => {
        await suggestAlternative('req-1', baseRequest, 'staff-1', suggestion);
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            status: 'alternative_suggested',
            suggestedFacilityId: 'fac-2',
            suggestedFacilityName: 'Squash Court',
            reviewNote: 'Try this instead',
        }));
    });

    test('notifies the member with type booking_alternative', async () => {
        await suggestAlternative('req-1', baseRequest, 'staff-1', suggestion);
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'member-1',
            type: 'booking_alternative',
            title: 'Alternative Facility Suggested',
        }));
    });
});

// ─── acceptAlternativeSuggestion ──────────────────────────────────────────────

describe('acceptAlternativeSuggestion', () => {
    test('updates status to approved using the suggested facility', async () => {
        const req = { ...baseRequest, suggestedFacilityId: 'fac-2', suggestedFacilityName: 'Squash Court' };
        await acceptAlternativeSuggestion('req-1', req);
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            status: 'approved',
            facilityId: 'fac-2',
            facilityName: 'Squash Court',
        }));
    });

    test('falls back to the original facility when no suggestion is set', async () => {
        await acceptAlternativeSuggestion('req-1', baseRequest);
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            status: 'approved',
            facilityId: 'fac-1',
            facilityName: 'Tennis Court',
        }));
    });
});

// ─── rejectAlternativeSuggestion ──────────────────────────────────────────────

describe('rejectAlternativeSuggestion', () => {
    test('deletes the booking request', async () => {
        await rejectAlternativeSuggestion('req-1');
        expect(mockDoc).toHaveBeenCalledWith({}, 'bookingRequests', 'req-1');
        expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });
});

// ─── cancelBookingRequest ─────────────────────────────────────────────────────

describe('cancelBookingRequest', () => {
    test('deletes the booking request', async () => {
        await cancelBookingRequest('req-1');
        expect(mockDoc).toHaveBeenCalledWith({}, 'bookingRequests', 'req-1');
        expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });
});

// ─── getBookingRequestsForFacility ────────────────────────────────────────────

describe('getBookingRequestsForFacility', () => {
    test('queries by facilityId', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getBookingRequestsForFacility('fac-1');
        expect(mockWhere).toHaveBeenCalledWith('facilityId', '==', 'fac-1');
    });

    test('maps documents to { id, ...data() }', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'r-1', data: { facilityId: 'fac-1', status: 'pending' } },
        ]));
        const result = await getBookingRequestsForFacility('fac-1');
        expect(result[0]).toMatchObject({ id: 'r-1', facilityId: 'fac-1' });
    });
});

// ─── cancelBookingRequestsForFacility ─────────────────────────────────────────

describe('cancelBookingRequestsForFacility', () => {
    test('queries by facilityId', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await cancelBookingRequestsForFacility('fac-1');
        expect(mockWhere).toHaveBeenCalledWith('facilityId', '==', 'fac-1');
    });

    test('deletes every returned document using d.ref', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'r-1', data: {} },
            { id: 'r-2', data: {} },
        ]));
        await cancelBookingRequestsForFacility('fac-1');
        expect(mockDeleteDoc).toHaveBeenCalledTimes(2);
        expect(mockDeleteDoc).toHaveBeenCalledWith('ref/r-1');
        expect(mockDeleteDoc).toHaveBeenCalledWith('ref/r-2');
    });

    test('does nothing when there are no requests for the facility', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await cancelBookingRequestsForFacility('fac-1');
        expect(mockDeleteDoc).not.toHaveBeenCalled();
    });
});
