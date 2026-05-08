import {
    getFacilities,
    getActiveFacilities,
    getFacilityById,
    getFacilitiesForStaff,
    createFacility,
    updateFacility,
    setFacilityActive,
    assignStaffToFacility,
    removeStaffFromFacility,
    deleteFacility,
} from '../facilities';
import {
    collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, arrayUnion, arrayRemove,
} from 'firebase/firestore';

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => 'colRef'),
    doc: jest.fn(() => 'docRef'),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
    addDoc: jest.fn().mockResolvedValue({ id: 'fac-new' }),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn((...args) => args[0]),
    where: jest.fn(() => 'whereClause'),
    arrayUnion: jest.fn((v) => ({ _arrayUnion: v })),
    arrayRemove: jest.fn((v) => ({ _arrayRemove: v })),
}));

const mockGetDocs  = getDocs  as jest.Mock;
const mockGetDoc   = getDoc   as jest.Mock;
const mockAddDoc   = addDoc   as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockCollection = collection as jest.Mock;
const mockDoc  = doc  as jest.Mock;
const mockWhere = where as jest.Mock;
const mockArrayUnion  = arrayUnion  as jest.Mock;
const mockArrayRemove = arrayRemove as jest.Mock;

function makeSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
    return { docs: docs.map(d => ({ id: d.id, data: () => d.data, ref: `ref/${d.id}` })) };
}
function makeDocSnap(id: string, data: Record<string, unknown>, exists = true) {
    return { id, exists: () => exists, data: () => (exists ? data : undefined) };
}

const facilityData = { name: 'Tennis Court', category: 'tennis', isActive: true };

afterEach(() => { jest.clearAllMocks(); });

// ─── getFacilities ────────────────────────────────────────────────────────────

describe('getFacilities', () => {
    test('calls getDocs on the facilities collection', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getFacilities();
        expect(mockCollection).toHaveBeenCalledWith({}, 'facilities');
    });

    test('maps documents to { id, ...data() }', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'f-1', data: { name: 'Pool',   isActive: true } },
            { id: 'f-2', data: { name: 'Gym',    isActive: false } },
        ]));
        const result = await getFacilities();
        expect(result.find(f => f.id === 'f-1')).toMatchObject({ id: 'f-1', name: 'Pool' });
    });

    test('returns facilities sorted alphabetically by name', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'f-3', data: { name: 'Squash Court' } },
            { id: 'f-1', data: { name: 'Badminton Hall' } },
            { id: 'f-2', data: { name: 'Gym' } },
        ]));
        const result = await getFacilities();
        expect(result.map(f => f.name)).toEqual(['Badminton Hall', 'Gym', 'Squash Court']);
    });
});

// ─── getActiveFacilities ──────────────────────────────────────────────────────

describe('getActiveFacilities', () => {
    test('queries where isActive==true', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getActiveFacilities();
        expect(mockWhere).toHaveBeenCalledWith('isActive', '==', true);
    });

    test('returns results sorted alphabetically by name', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'f-2', data: { name: 'Tennis', isActive: true } },
            { id: 'f-1', data: { name: 'Gym',    isActive: true } },
        ]));
        const result = await getActiveFacilities();
        expect(result.map(f => f.name)).toEqual(['Gym', 'Tennis']);
    });
});

// ─── getFacilityById ──────────────────────────────────────────────────────────

describe('getFacilityById', () => {
    test('calls doc with the correct path', async () => {
        mockGetDoc.mockResolvedValue(makeDocSnap('f-1', facilityData));
        await getFacilityById('f-1');
        expect(mockDoc).toHaveBeenCalledWith({}, 'facilities', 'f-1');
    });

    test('returns null when the document does not exist', async () => {
        mockGetDoc.mockResolvedValue(makeDocSnap('f-x', {}, false));
        expect(await getFacilityById('f-x')).toBeNull();
    });

    test('returns { id, ...data() } when the document exists', async () => {
        mockGetDoc.mockResolvedValue(makeDocSnap('f-1', facilityData));
        const result = await getFacilityById('f-1');
        expect(result).toMatchObject({ id: 'f-1', name: 'Tennis Court' });
    });
});

// ─── getFacilitiesForStaff ────────────────────────────────────────────────────

describe('getFacilitiesForStaff', () => {
    test('queries where assignedStaffIds array-contains the staffId', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getFacilitiesForStaff('staff-1');
        expect(mockWhere).toHaveBeenCalledWith('assignedStaffIds', 'array-contains', 'staff-1');
    });

    test('maps each document to { id, ...data() }', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'f-1', data: { name: 'Pool', assignedStaffIds: ['staff-1'] } },
        ]));
        const result = await getFacilitiesForStaff('staff-1');
        expect(result[0]).toMatchObject({ id: 'f-1', name: 'Pool' });
    });
});

// ─── createFacility ───────────────────────────────────────────────────────────

describe('createFacility', () => {
    test('calls addDoc on the facilities collection', async () => {
        await createFacility(facilityData as never);
        expect(mockCollection).toHaveBeenCalledWith({}, 'facilities');
        expect(mockAddDoc).toHaveBeenCalledTimes(1);
    });

    test('includes createdAt and updatedAt timestamps', async () => {
        await createFacility(facilityData as never);
        const [, payload] = mockAddDoc.mock.calls[0];
        expect(payload).toMatchObject({
            createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
            updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        });
    });

    test('returns the new facility ID', async () => {
        const id = await createFacility(facilityData as never);
        expect(id).toBe('fac-new');
    });

    test('includes the provided data in the payload', async () => {
        await createFacility(facilityData as never);
        const [, payload] = mockAddDoc.mock.calls[0];
        expect(payload).toMatchObject(facilityData);
    });
});

// ─── updateFacility ───────────────────────────────────────────────────────────

describe('updateFacility', () => {
    test('calls doc with the correct path', async () => {
        await updateFacility('f-1', { name: 'New Name' });
        expect(mockDoc).toHaveBeenCalledWith({}, 'facilities', 'f-1');
    });

    test('calls updateDoc with the provided data and an updatedAt timestamp', async () => {
        await updateFacility('f-1', { name: 'New Name' });
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            name: 'New Name',
            updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }));
    });
});

// ─── setFacilityActive ────────────────────────────────────────────────────────

describe('setFacilityActive', () => {
    test('calls updateDoc with isActive=true', async () => {
        await setFacilityActive('f-1', true);
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({ isActive: true }));
    });

    test('calls updateDoc with isActive=false', async () => {
        await setFacilityActive('f-1', false);
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({ isActive: false }));
    });

    test('includes an updatedAt timestamp', async () => {
        await setFacilityActive('f-1', true);
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }));
    });
});

// ─── assignStaffToFacility ────────────────────────────────────────────────────

describe('assignStaffToFacility', () => {
    test('calls doc with the facility path', async () => {
        await assignStaffToFacility('f-1', 'staff-1');
        expect(mockDoc).toHaveBeenCalledWith({}, 'facilities', 'f-1');
    });

    test('calls arrayUnion with the staffId', async () => {
        await assignStaffToFacility('f-1', 'staff-1');
        expect(mockArrayUnion).toHaveBeenCalledWith('staff-1');
    });

    test('passes the arrayUnion result under assignedStaffIds', async () => {
        await assignStaffToFacility('f-1', 'staff-1');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            assignedStaffIds: { _arrayUnion: 'staff-1' },
        }));
    });
});

// ─── removeStaffFromFacility ──────────────────────────────────────────────────

describe('removeStaffFromFacility', () => {
    test('calls arrayRemove with the staffId', async () => {
        await removeStaffFromFacility('f-1', 'staff-1');
        expect(mockArrayRemove).toHaveBeenCalledWith('staff-1');
    });

    test('passes the arrayRemove result under assignedStaffIds', async () => {
        await removeStaffFromFacility('f-1', 'staff-1');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            assignedStaffIds: { _arrayRemove: 'staff-1' },
        }));
    });
});

// ─── deleteFacility ───────────────────────────────────────────────────────────

describe('deleteFacility', () => {
    test('calls doc with the correct path', async () => {
        await deleteFacility('f-1');
        expect(mockDoc).toHaveBeenCalledWith({}, 'facilities', 'f-1');
    });

    test('calls deleteDoc with the doc reference', async () => {
        await deleteFacility('f-1');
        expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });
});
