import {
    createEquipmentReport,
    getEquipmentReportsByMember,
    getEquipmentReportsForStaff,
    getAllEquipmentReports,
    updateEquipmentReportStatus,
} from '../equipmentReports';
import { collection, doc, getDocs, addDoc, updateDoc, where } from 'firebase/firestore';
import { getFacilitiesForStaff } from '@/lib/facilities';
import { createNotification } from '@/lib/notifications';
import type { EquipmentReport } from '@/types/equipmentReport';

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => 'colRef'),
    doc: jest.fn(() => 'docRef'),
    getDocs: jest.fn(),
    addDoc: jest.fn().mockResolvedValue({ id: 'rep-new' }),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn((...args) => args[0]),
    where: jest.fn(() => 'whereClause'),
}));
jest.mock('@/lib/facilities', () => ({ getFacilitiesForStaff: jest.fn() }));
jest.mock('@/lib/notifications', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }));
// Let reportStatusLabel use its real implementation so messages reflect correct labels
// (no mock needed - the import is direct and its module has no side-effects)

const mockGetDocs   = getDocs   as jest.Mock;
const mockAddDoc    = addDoc    as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockCollection = collection as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockWhere = where as jest.Mock;
const mockGetFacilitiesForStaff = getFacilitiesForStaff as jest.Mock;
const mockCreateNotification    = createNotification    as jest.Mock;

function makeSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
    return { docs: docs.map(d => ({ id: d.id, data: () => d.data, ref: `ref/${d.id}` })) };
}

const baseReport: EquipmentReport = {
    id: 'rep-1',
    reportedBy: 'member-1',
    reporterName: 'Alice',
    facilityId: 'fac-1',
    facilityName: 'Gym',
    equipmentName: 'Treadmill',
    description: 'Belt slipping',
    status: 'pending',
    staffNote: '',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
};

afterEach(() => { jest.clearAllMocks(); });

// ─── createEquipmentReport ────────────────────────────────────────────────────

describe('createEquipmentReport', () => {
    const input = {
        reportedBy: 'member-1',
        reporterName: 'Alice',
        facilityId: 'fac-1',
        facilityName: 'Gym',
        equipmentName: 'Treadmill',
        description: 'Belt slipping',
    };

    test('calls addDoc on the equipmentReports collection', async () => {
        await createEquipmentReport(input);
        expect(mockCollection).toHaveBeenCalledWith({}, 'equipmentReports');
        expect(mockAddDoc).toHaveBeenCalledTimes(1);
    });

    test('sets status=pending and staffNote="" by default', async () => {
        await createEquipmentReport(input);
        const [, payload] = mockAddDoc.mock.calls[0];
        expect(payload).toMatchObject({ status: 'pending', staffNote: '' });
    });

    test('includes createdAt and updatedAt timestamps', async () => {
        await createEquipmentReport(input);
        const [, payload] = mockAddDoc.mock.calls[0];
        expect(payload.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(payload.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('includes all provided input fields', async () => {
        await createEquipmentReport(input);
        const [, payload] = mockAddDoc.mock.calls[0];
        expect(payload).toMatchObject(input);
    });
});

// ─── getEquipmentReportsByMember ──────────────────────────────────────────────

describe('getEquipmentReportsByMember', () => {
    test('queries by reportedBy', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getEquipmentReportsByMember('member-1');
        expect(mockWhere).toHaveBeenCalledWith('reportedBy', '==', 'member-1');
    });

    test('maps documents to { id, ...data() }', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'rep-1', data: { equipmentName: 'Treadmill', reportedBy: 'member-1', createdAt: '2026-05-01T10:00:00Z' } },
        ]));
        const result = await getEquipmentReportsByMember('member-1');
        expect(result[0]).toMatchObject({ id: 'rep-1', equipmentName: 'Treadmill' });
    });

    test('sorts by createdAt descending', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'rep-1', data: { createdAt: '2026-05-01T10:00:00Z' } },
            { id: 'rep-2', data: { createdAt: '2026-05-03T10:00:00Z' } },
        ]));
        const result = await getEquipmentReportsByMember('member-1');
        expect(result.map(r => r.id)).toEqual(['rep-2', 'rep-1']);
    });
});

// ─── getEquipmentReportsForStaff ──────────────────────────────────────────────

describe('getEquipmentReportsForStaff', () => {
    test('returns empty array when no facilities are assigned', async () => {
        mockGetFacilitiesForStaff.mockResolvedValue([]);
        expect(await getEquipmentReportsForStaff('staff-1')).toEqual([]);
        expect(mockGetDocs).not.toHaveBeenCalled();
    });

    test('queries by facilityId in the assigned facility list', async () => {
        mockGetFacilitiesForStaff.mockResolvedValue([{ id: 'fac-1' }, { id: 'fac-2' }]);
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getEquipmentReportsForStaff('staff-1');
        expect(mockWhere).toHaveBeenCalledWith('facilityId', 'in', ['fac-1', 'fac-2']);
    });

    test('sorts results by createdAt descending', async () => {
        mockGetFacilitiesForStaff.mockResolvedValue([{ id: 'fac-1' }]);
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'rep-1', data: { createdAt: '2026-05-01T10:00:00Z' } },
            { id: 'rep-2', data: { createdAt: '2026-05-04T10:00:00Z' } },
        ]));
        const result = await getEquipmentReportsForStaff('staff-1');
        expect(result.map(r => r.id)).toEqual(['rep-2', 'rep-1']);
    });
});

// ─── getAllEquipmentReports ────────────────────────────────────────────────────

describe('getAllEquipmentReports', () => {
    test('fetches from the equipmentReports collection without a filter', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([]));
        await getAllEquipmentReports();
        expect(mockCollection).toHaveBeenCalledWith({}, 'equipmentReports');
    });

    test('sorts by createdAt descending', async () => {
        mockGetDocs.mockResolvedValue(makeSnap([
            { id: 'rep-1', data: { createdAt: '2026-05-01T10:00:00Z' } },
            { id: 'rep-2', data: { createdAt: '2026-05-05T10:00:00Z' } },
        ]));
        const result = await getAllEquipmentReports();
        expect(result.map(r => r.id)).toEqual(['rep-2', 'rep-1']);
    });
});

// ─── updateEquipmentReportStatus ──────────────────────────────────────────────

describe('updateEquipmentReportStatus', () => {
    test('calls doc with the correct path', async () => {
        await updateEquipmentReportStatus('rep-1', baseReport, 'noted', 'staff-1', 'Acknowledged');
        expect(mockDoc).toHaveBeenCalledWith({}, 'equipmentReports', 'rep-1');
    });

    test('calls updateDoc with the new status, staffNote, updatedBy, and updatedAt', async () => {
        await updateEquipmentReportStatus('rep-1', baseReport, 'repair_in_progress', 'staff-1', 'Ordering parts');
        expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({
            status: 'repair_in_progress',
            staffNote: 'Ordering parts',
            updatedBy: 'staff-1',
            updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }));
    });

    test('notifies the reporter with type equipment_report_updated', async () => {
        await updateEquipmentReportStatus('rep-1', baseReport, 'resolved', 'staff-1', 'Fixed');
        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'member-1',
            type: 'equipment_report_updated',
            title: 'Equipment Report Updated',
            relatedId: 'rep-1',
            relatedType: 'equipmentReport',
        }));
    });

    test('notification message includes the equipment name and new status label', async () => {
        await updateEquipmentReportStatus('rep-1', baseReport, 'resolved', 'staff-1', 'Done');
        const [payload] = mockCreateNotification.mock.calls[0];
        expect(payload.message).toContain('Treadmill');
        expect(payload.message).toContain('Resolved');
    });

    test('notification message includes the facility name', async () => {
        await updateEquipmentReportStatus('rep-1', baseReport, 'noted', 'staff-1', '');
        const [payload] = mockCreateNotification.mock.calls[0];
        expect(payload.message).toContain('Gym');
    });

    test('works for all report status values', async () => {
        for (const status of ['pending', 'noted', 'repair_in_progress', 'resolved'] as const) {
            jest.clearAllMocks();
            await updateEquipmentReportStatus('rep-1', baseReport, status, 'staff-1', '');
            expect(mockUpdateDoc).toHaveBeenCalledWith('docRef', expect.objectContaining({ status }));
        }
    });
});
