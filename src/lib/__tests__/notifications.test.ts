import {
    createNotification,
    getNotificationsForUser,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotifications,
} from '../notifications';
import {
    collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where,
} from 'firebase/firestore';

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => 'colRef'),
    doc: jest.fn(() => 'docRef'),
    getDocs: jest.fn(),
    addDoc: jest.fn().mockResolvedValue({ id: 'n-new' }),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn((...args) => args[0]),
    where: jest.fn(() => 'whereClause'),
}));

const mockGetDocs  = getDocs  as jest.Mock;
const mockAddDoc   = addDoc   as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockCollection = collection as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockWhere = where as jest.Mock;

function makeSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
    return { docs: docs.map(d => ({ id: d.id, data: () => d.data, ref: `ref/${d.id}` })) };
}

function makeNotif(id: string, read: boolean, createdAt: string) {
    return { id, data: { userId: 'u-1', type: 'booking_cancelled', title: 'T', message: 'M', relatedId: 'r', relatedType: 'booking', read, createdAt } };
}

afterEach(() => { jest.clearAllMocks(); });

// ─── createNotification ───────────────────────────────────────────────────────

describe('createNotification', () => {
    test('calls collection with "notifications"', async () => {
        await createNotification({ userId: 'u-1', type: 'booking_cancelled', title: 'T', message: 'M', relatedId: 'r', relatedType: 'booking' });
        expect(mockCollection).toHaveBeenCalledWith({}, 'notifications');
    });

    test('calls addDoc with read:false and an ISO createdAt timestamp', async () => {
        await createNotification({ userId: 'u-1', type: 'booking_cancelled', title: 'T', message: 'M', relatedId: 'r', relatedType: 'booking' });
        expect(mockAddDoc).toHaveBeenCalledWith('colRef', expect.objectContaining({
            userId: 'u-1',
            type: 'booking_cancelled',
            read: false,
            createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }));
    });

    test('does not include id or read in the input data (they are set by the function)', async () => {
        const data = { userId: 'u-1', type: 'booking_completed' as const, title: 'T', message: 'M', relatedId: 'r', relatedType: 'booking' as const };
        await createNotification(data);
        const [, payload] = mockAddDoc.mock.calls[0];
        expect(payload).not.toHaveProperty('id');
    });
});

// ─── getNotificationsForUser ──────────────────────────────────────────────────

describe('getNotificationsForUser', () => {
    test('queries notifications where userId matches', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getNotificationsForUser('u-1');
        expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'u-1');
    });

    test('maps documents to { id, ...data() }', async () => {
        const n = makeNotif('n-1', false, '2026-05-01T10:00:00Z');
        mockGetDocs.mockResolvedValue(makeSnap([n]));
        const result = await getNotificationsForUser('u-1');
        expect(result[0]).toMatchObject({ id: 'n-1', read: false });
    });

    test('sorts by createdAt descending (newest first)', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            makeNotif('n-1', false, '2026-05-01T08:00:00Z'),
            makeNotif('n-2', false, '2026-05-03T12:00:00Z'),
            makeNotif('n-3', false, '2026-05-02T06:00:00Z'),
        ]));
        const result = await getNotificationsForUser('u-1');
        expect(result.map(n => n.id)).toEqual(['n-2', 'n-3', 'n-1']);
    });

    test('returns an empty array when there are no notifications', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        expect(await getNotificationsForUser('u-1')).toEqual([]);
    });
});

// ─── getUnreadCount ───────────────────────────────────────────────────────────

describe('getUnreadCount', () => {
    test('returns 0 when all notifications are read', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            makeNotif('n-1', true, '2026-05-01T10:00:00Z'),
            makeNotif('n-2', true, '2026-05-01T11:00:00Z'),
        ]));
        expect(await getUnreadCount('u-1')).toBe(0);
    });

    test('counts only unread notifications', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            makeNotif('n-1', false, '2026-05-01T10:00:00Z'),
            makeNotif('n-2', true,  '2026-05-01T11:00:00Z'),
            makeNotif('n-3', false, '2026-05-01T12:00:00Z'),
        ]));
        expect(await getUnreadCount('u-1')).toBe(2);
    });

    test('returns 0 when there are no notifications', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        expect(await getUnreadCount('u-1')).toBe(0);
    });
});

// ─── markNotificationRead ─────────────────────────────────────────────────────

describe('markNotificationRead', () => {
    test('calls doc with the correct path', async () => {
        await markNotificationRead('n-1');
        expect(mockDoc).toHaveBeenCalledWith({}, 'notifications', 'n-1');
    });

    test('calls updateDoc with { read: true }', async () => {
        await markNotificationRead('n-1');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', { read: true });
    });
});

// ─── markAllNotificationsRead ─────────────────────────────────────────────────

describe('markAllNotificationsRead', () => {
    test('calls updateDoc for each unread notification', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            makeNotif('n-1', false, '2026-05-01T10:00:00Z'),
            makeNotif('n-2', true,  '2026-05-01T11:00:00Z'),
            makeNotif('n-3', false, '2026-05-01T12:00:00Z'),
        ]));
        await markAllNotificationsRead('u-1');
        // n-1 and n-3 are unread → 2 updateDoc calls
        expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', { read: true });
    });

    test('does nothing when all notifications are already read', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            makeNotif('n-1', true, '2026-05-01T10:00:00Z'),
        ]));
        await markAllNotificationsRead('u-1');
        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    test('does nothing when there are no notifications', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await markAllNotificationsRead('u-1');
        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
});

// ─── deleteNotifications ──────────────────────────────────────────────────────

describe('deleteNotifications', () => {
    test('calls deleteDoc once for each id', async () => {
        await deleteNotifications(['n-1', 'n-2', 'n-3']);
        expect(mockDeleteDoc).toHaveBeenCalledTimes(3);
    });

    test('passes the doc reference for each id', async () => {
        await deleteNotifications(['n-1']);
        expect(mockDoc).toHaveBeenCalledWith({}, 'notifications', 'n-1');
        expect(mockDeleteDoc).toHaveBeenCalledWith('docRef');
    });

    test('does nothing when passed an empty array', async () => {
        await deleteNotifications([]);
        expect(mockDeleteDoc).not.toHaveBeenCalled();
    });
});
