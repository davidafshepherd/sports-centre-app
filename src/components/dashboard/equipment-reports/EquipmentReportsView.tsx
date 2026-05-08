'use client';

import { useEffect, useState, useCallback } from 'react';
import { Wrench, Plus } from 'lucide-react';

import { useAuth } from '@/providers/AuthProvider';
import { getEquipmentReportsByMember, getEquipmentReportsForStaff } from '@/lib/equipmentReports';
import { getFacilities } from '@/lib/facilities';
import { reportStatusLabel } from '@/lib/utils/status';
import type { EquipmentReport, ReportStatus } from '@/types/equipmentReport';
import type { Facility } from '@/types/facility';
import ReportCard from './ReportCard';
import ReportFormModal from './ReportFormModal';
import UpdateStatusModal from './UpdateStatusModal';

const STATUS_FILTERS: { label: string; value: ReportStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Noted', value: 'noted' },
    { label: 'In Progress', value: 'repair_in_progress' },
    { label: 'Resolved', value: 'resolved' },
];

export default function EquipmentReportsView() {
    const { user, userProfile } = useAuth();
    const role = userProfile?.role;

    const [reports, setReports] = useState<EquipmentReport[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
    const [showReportForm, setShowReportForm] = useState(false);
    const [updateTarget, setUpdateTarget] = useState<EquipmentReport | null>(null);

    // Fetch reports based on role: members see their own, staff see their facilities'
    const load = useCallback(async () => {
        if (!user || !role) return;
        setLoading(true);
        const [fetchedReports, fetchedFacilities] = await Promise.all([
            role === 'member'
                ? getEquipmentReportsByMember(user.uid)
                : getEquipmentReportsForStaff(user.uid),
            role === 'member' ? getFacilities() : Promise.resolve([] as Facility[]),
        ]);
        setReports(fetchedReports);
        setFacilities(fetchedFacilities);
        setLoading(false);
    }, [user, role]);

    useEffect(() => { load(); }, [load]);

    const visibleReports = statusFilter === 'all'
        ? reports
        : reports.filter(r => r.status === statusFilter);

    const canUpdate = role === 'staff';

    const emptyMessage = role === 'member'
        ? "You haven't reported any equipment issues yet."
        : 'No equipment reports for your assigned facilities.';

    if (loading) return (
        <div className="max-w-2xl mx-auto space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
            ))}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            <div className="flex items-center gap-1.5 flex-wrap">
                {STATUS_FILTERS.map(filter => (
                    <button
                        key={filter.value}
                        onClick={() => setStatusFilter(filter.value)}
                        className={[
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                            statusFilter === filter.value
                                ? 'bg-sky-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
                        ].join(' ')}
                    >
                        {filter.label}
                        {filter.value !== 'all' && (
                            <span className="ml-1.5 opacity-60">
                                {reports.filter(r => r.status === filter.value).length}
                            </span>
                        )}
                    </button>
                ))}
                {role === 'member' && (
                    <button
                        onClick={() => setShowReportForm(true)}
                        className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium hover:bg-sky-700 cursor-pointer transition-colors shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Report Issue
                    </button>
                )}
            </div>

            {visibleReports.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <Wrench className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-700">
                        {statusFilter !== 'all'
                            ? `No ${reportStatusLabel(statusFilter as ReportStatus).toLowerCase()} reports.`
                            : 'No reports yet.'}
                    </p>
                    <p className="text-sm mt-1">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleReports.map(report => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            canUpdate={canUpdate}
                            onUpdate={setUpdateTarget}
                        />
                    ))}
                </div>
            )}

            {showReportForm && userProfile && (
                <ReportFormModal
                    facilities={facilities}
                    memberId={user?.uid ?? ''}
                    memberName={`${userProfile.firstName} ${userProfile.lastName}`}
                    onClose={() => setShowReportForm(false)}
                    onSubmitted={() => { setShowReportForm(false); load(); }}
                />
            )}

            {updateTarget && user && (
                <UpdateStatusModal
                    report={updateTarget}
                    staffUid={user.uid}
                    onClose={() => setUpdateTarget(null)}
                    onUpdated={() => { setUpdateTarget(null); load(); }}
                />
            )}
        </div>
    );
}
