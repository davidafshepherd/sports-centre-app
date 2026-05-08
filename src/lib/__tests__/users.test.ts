import {
    getStaffUsers,
    getUsersByIds,
    updateUserMembershipStatus,
    updateUserProfile,
    deleteUserProfile,
} from '../users';
import { collection, doc, getDocs, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => 'colRef'),
    doc: jest.fn(() => 'docRef'),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn((...args) => args[0]),
    where: jest.fn(() => 'whereClause'),
}));

const mockGetDocs = getDocs as jest.Mock;
const mockGetDoc  = getDoc  as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockCollection = collection as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockWhere = where as jest.Mock;

function makeSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
    return { docs: docs.map(d => ({ id: d.id, data: () => d.data, ref: `ref/${d.id}` })) };
}
function makeDocSnap(id: string, data: Record<string, unknown>, exists = true) {
    return { id, exists: () => exists, data: () => (exists ? data : undefined) };
}

afterEach(() => { jest.clearAllMocks(); });

// ─── getStaffUsers ────────────────────────────────────────────────────────────

describe('getStaffUsers', () => {
    test('queries the users collection filtered by role==staff', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getStaffUsers();
        expect(mockCollection).toHaveBeenCalledWith({}, 'users');
        expect(mockWhere).toHaveBeenCalledWith('role', '==', 'staff');
    });

    test('maps each document to { uid: d.id, ...d.data() }', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 's-1', data: { role: 'staff', firstName: 'Alice' } },
            { id: 's-2', data: { role: 'staff', firstName: 'Bob'   } },
        ]));
        const result = await getStaffUsers();
        expect(result).toEqual([
            { uid: 's-1', role: 'staff', firstName: 'Alice' },
            { uid: 's-2', role: 'staff', firstName: 'Bob'   },
        ]);
    });

    test('returns an empty array when there are no staff users', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        expect(await getStaffUsers()).toEqual([]);
    });
});

// ─── getUsersByIds ────────────────────────────────────────────────────────────

describe('getUsersByIds', () => {
    test('returns an empty array immediately when ids is empty', async () => {
        expect(await getUsersByIds([])).toEqual([]);
        expect(mockGetDoc).not.toHaveBeenCalled();
    });

    test('calls getDoc once per id', async () => {
        mockGetDoc
            .mockResolvedValueOnce(makeDocSnap('u-1', { firstName: 'Alice' }))
            .mockResolvedValueOnce(makeDocSnap('u-2', { firstName: 'Bob'   }));
        await getUsersByIds(['u-1', 'u-2']);
        expect(mockGetDoc).toHaveBeenCalledTimes(2);
    });

    test('maps found documents to { uid: s.id, ...s.data() }', async () => {
        mockGetDoc.mockResolvedValue(makeDocSnap('u-1', { firstName: 'Alice', role: 'member' }));
        const result = await getUsersByIds(['u-1']);
        expect(result).toEqual([{ uid: 'u-1', firstName: 'Alice', role: 'member' }]);
    });

    test('filters out documents that do not exist', async () => {
        mockGetDoc
            .mockResolvedValueOnce(makeDocSnap('u-1', { firstName: 'Alice' }))
            .mockResolvedValueOnce(makeDocSnap('u-2', {},                    false));
        const result = await getUsersByIds(['u-1', 'u-2']);
        expect(result).toHaveLength(1);
        expect(result[0].uid).toBe('u-1');
    });
});

// ─── updateUserMembershipStatus ───────────────────────────────────────────────

describe('updateUserMembershipStatus', () => {
    test('calls doc with the correct path', async () => {
        await updateUserMembershipStatus('user-1', 'active');
        expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user-1');
    });

    test('calls updateDoc with { membershipStatus }', async () => {
        await updateUserMembershipStatus('user-1', 'suspended');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', { membershipStatus: 'suspended' });
    });

    test('supports all membership status values', async () => {
        for (const status of ['active', 'suspended', 'pending'] as const) {
            jest.clearAllMocks();
            await updateUserMembershipStatus('u', status);
            expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', { membershipStatus: status });
        }
    });
});

// ─── updateUserProfile ────────────────────────────────────────────────────────

describe('updateUserProfile', () => {
    test('calls doc with the correct path', async () => {
        await updateUserProfile('user-1', { firstName: 'Alice' });
        expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user-1');
    });

    test('passes the provided data object to updateDoc', async () => {
        const data = { firstName: 'Bob', lastName: 'Smith', dateOfBirth: '1990-01-01' };
        await updateUserProfile('user-1', data);
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', data);
    });

    test('passes a partial update (only one field)', async () => {
        await updateUserProfile('user-2', { lastName: 'Jones' });
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', { lastName: 'Jones' });
    });
});

// ─── deleteUserProfile ────────────────────────────────────────────────────────

describe('deleteUserProfile', () => {
    test('calls doc with the correct path', async () => {
        await deleteUserProfile('user-1');
        expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user-1');
    });

    test('calls deleteDoc with the doc reference', async () => {
        await deleteUserProfile('user-1');
        expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });
});
