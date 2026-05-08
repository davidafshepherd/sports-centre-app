import {
    getPartnerProfile,
    upsertPartnerProfile,
    searchPartnerProfiles,
    sendPartnerRequest,
    getPartnerRequestsReceived,
    getPartnerRequestsSent,
    respondToPartnerRequest,
} from '../partners';
import {
    collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, query, where,
} from 'firebase/firestore';
import { createNotification } from '@/lib/notifications';
import type { PartnerRequest } from '@/types/partnerProfile';

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => 'colRef'),
    doc: jest.fn(() => 'docRef'),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn().mockResolvedValue(undefined),
    addDoc: jest.fn().mockResolvedValue({ id: 'pr-new' }),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn((...args) => args[0]),
    where: jest.fn(() => 'whereClause'),
}));
jest.mock('@/lib/notifications', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }));

const mockGetDocs   = getDocs   as jest.Mock;
const mockGetDoc    = getDoc    as jest.Mock;
const mockSetDoc    = setDoc    as jest.Mock;
const mockAddDoc    = addDoc    as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockWhere = where as jest.Mock;
const mockCreateNotification = createNotification as jest.Mock;

function makeSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
    return { docs: docs.map(d => ({ id: d.id, data: () => d.data, ref: `ref/${d.id}` })) };
}
function makeDocSnap(id: string, data: Record<string, unknown>, exists = true) {
    return { id, exists: () => exists, data: () => (exists ? data : undefined) };
}

const baseRequest: PartnerRequest = {
    id: 'pr-1',
    senderId: 'u-1',
    senderName: 'Alice',
    receiverId: 'u-2',
    receiverName: 'Bob',
    sport: 'tennis',
    message: 'Want to play?',
    status: 'pending',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
};

afterEach(() => { jest.clearAllMocks(); });

// ─── getPartnerProfile ────────────────────────────────────────────────────────

describe('getPartnerProfile', () => {
    test('calls doc with the correct path', async () => {
        mockGetDoc.mockResolvedValue(makeDocSnap('u-1', {}, false));
        await getPartnerProfile('u-1');
        expect(mockDoc).toHaveBeenCalledWith({}, 'partnerProfiles', 'u-1');
    });

    test('returns null when the profile does not exist', async () => {
        mockGetDoc.mockResolvedValue(makeDocSnap('u-1', {}, false));
        expect(await getPartnerProfile('u-1')).toBeNull();
    });

    test('returns { uid, ...data() } when the profile exists', async () => {
        mockGetDoc.mockResolvedValue(makeDocSnap('u-1', { sport: 'tennis', isVisible: true }));
        const result = await getPartnerProfile('u-1');
        expect(result).toMatchObject({ uid: 'u-1', sport: 'tennis' });
    });
});

// ─── upsertPartnerProfile ─────────────────────────────────────────────────────

describe('upsertPartnerProfile', () => {
    test('calls setDoc on the correct doc path', async () => {
        await upsertPartnerProfile('u-1', { sport: 'tennis', isVisible: true } as never);
        expect(mockDoc).toHaveBeenCalledWith({}, 'partnerProfiles', 'u-1');
    });

    test('merges the data with uid and updatedAt', async () => {
        await upsertPartnerProfile('u-1', { sport: 'tennis' } as never);
        expect(mockSetDoc).toHaveBeenCalledWith(
            'docRef',
            expect.objectContaining({
                uid: 'u-1',
                sport: 'tennis',
                updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
            }),
            { merge: true },
        );
    });
});

// ─── searchPartnerProfiles ────────────────────────────────────────────────────

describe('searchPartnerProfiles', () => {
    const visibleProfiles = [
        { id: 'u-1', data: { uid: 'u-1', sport: 'tennis', skillLevel: 'beginner', isVisible: true } },
        { id: 'u-2', data: { uid: 'u-2', sport: 'tennis', skillLevel: 'advanced', isVisible: true } },
        { id: 'u-3', data: { uid: 'u-3', sport: 'badminton', skillLevel: 'beginner', isVisible: true } },
    ];

    test('queries where isVisible==true', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await searchPartnerProfiles('u-x');
        expect(mockWhere).toHaveBeenCalledWith('isVisible', '==', true);
    });

    test('excludes the calling user from results', async () => {
        mockGetDocs.mockResolvedValue(makeSnap(visibleProfiles));
        const result = await searchPartnerProfiles('u-1');
        expect(result.every(p => p.uid !== 'u-1')).toBe(true);
    });

    test('filters by sport when provided', async () => {
        mockGetDocs.mockResolvedValue(makeSnap(visibleProfiles));
        const result = await searchPartnerProfiles('u-x', 'tennis');
        expect(result.every(p => p.sport === 'tennis')).toBe(true);
        expect(result).toHaveLength(2);
    });

    test('filters by skillLevel when provided', async () => {
        mockGetDocs.mockResolvedValue(makeSnap(visibleProfiles));
        const result = await searchPartnerProfiles('u-x', undefined, 'beginner');
        expect(result.every(p => p.skillLevel === 'beginner')).toBe(true);
    });

    test('filters by both sport and skillLevel when both are provided', async () => {
        mockGetDocs.mockResolvedValue(makeSnap(visibleProfiles));
        const result = await searchPartnerProfiles('u-x', 'tennis', 'beginner');
        expect(result).toHaveLength(1);
        expect(result[0].uid).toBe('u-2' === result[0].uid ? 'u-2' : 'u-1');
        // beginner tennis: u-1 (but u-1 matches excludeUid? No, excludeUid is u-x)
        expect(result[0].sport).toBe('tennis');
        expect(result[0].skillLevel).toBe('beginner');
    });

    test('returns all visible profiles (except self) when no filters are given', async () => {
        mockGetDocs.mockResolvedValue(makeSnap(visibleProfiles));
        const result = await searchPartnerProfiles('u-x');
        expect(result).toHaveLength(3);
    });
});

// ─── sendPartnerRequest ───────────────────────────────────────────────────────

describe('sendPartnerRequest', () => {
    const data = {
        senderId: 'u-1', senderName: 'Alice',
        receiverId: 'u-2', receiverName: 'Bob',
        sport: 'tennis', message: 'Play?',
    };

    test('creates a partner request document with status=pending', async () => {
        await sendPartnerRequest(data);
        expect(mockAddDoc).toHaveBeenCalledWith('colRef', expect.objectContaining({
            ...data,
            status: 'pending',
        }));
    });

    test('sends a partner_request notification to the receiver', async () => {
        await sendPartnerRequest(data);
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'u-2',
            type: 'partner_request',
            title: 'New Partner Request',
            relatedId: 'pr-new',
        }));
    });

    test('includes the sender name and sport in the notification message', async () => {
        await sendPartnerRequest(data);
        const [payload] = mockCreateNotification.mock.calls[0];
        expect(payload.message).toContain('Alice');
        expect(payload.message).toContain('tennis');
    });
});

// ─── getPartnerRequestsReceived ───────────────────────────────────────────────

describe('getPartnerRequestsReceived', () => {
    test('queries by receiverId', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getPartnerRequestsReceived('u-2');
        expect(mockWhere).toHaveBeenCalledWith('receiverId', '==', 'u-2');
    });

    test('sorts by createdAt descending', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'pr-1', data: { createdAt: '2026-05-01T10:00:00Z' } },
            { id: 'pr-2', data: { createdAt: '2026-05-03T10:00:00Z' } },
        ]));
        const result = await getPartnerRequestsReceived('u-2');
        expect(result.map(r => r.id)).toEqual(['pr-2', 'pr-1']);
    });
});

// ─── getPartnerRequestsSent ───────────────────────────────────────────────────

describe('getPartnerRequestsSent', () => {
    test('queries by senderId', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getPartnerRequestsSent('u-1');
        expect(mockWhere).toHaveBeenCalledWith('senderId', '==', 'u-1');
    });

    test('sorts by createdAt descending', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'pr-1', data: { createdAt: '2026-05-02T10:00:00Z' } },
            { id: 'pr-2', data: { createdAt: '2026-05-04T10:00:00Z' } },
        ]));
        const result = await getPartnerRequestsSent('u-1');
        expect(result.map(r => r.id)).toEqual(['pr-2', 'pr-1']);
    });
});

// ─── respondToPartnerRequest ──────────────────────────────────────────────────

describe('respondToPartnerRequest', () => {
    test('updates status to accepted', async () => {
        await respondToPartnerRequest('pr-1', baseRequest, 'accepted');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            status: 'accepted',
        }));
    });

    test('updates status to rejected', async () => {
        await respondToPartnerRequest('pr-1', baseRequest, 'rejected');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            status: 'rejected',
        }));
    });

    test('sends partner_accepted notification to the sender on accept', async () => {
        await respondToPartnerRequest('pr-1', baseRequest, 'accepted');
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'u-1',
            type: 'partner_accepted',
            title: 'Partner Request Accepted',
        }));
    });

    test('sends partner_rejected notification to the sender on reject', async () => {
        await respondToPartnerRequest('pr-1', baseRequest, 'rejected');
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'u-1',
            type: 'partner_rejected',
            title: 'Partner Request Declined',
        }));
    });

    test('accepted message mentions the receiver name and sport', async () => {
        await respondToPartnerRequest('pr-1', baseRequest, 'accepted');
        const [payload] = mockCreateNotification.mock.calls[0];
        expect(payload.message).toContain('Bob');
        expect(payload.message).toContain('tennis');
    });

    test('rejected message mentions the receiver name and sport', async () => {
        await respondToPartnerRequest('pr-1', baseRequest, 'rejected');
        const [payload] = mockCreateNotification.mock.calls[0];
        expect(payload.message).toContain('Bob');
        expect(payload.message).toContain('tennis');
    });
});
