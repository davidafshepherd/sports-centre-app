'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, ShieldOff, RotateCcw } from 'lucide-react';
import { getStaffUsers, updateUserMembershipStatus } from '@/lib/users';
import { STATUS_FILTERS, STATUS_BADGE } from '@/types/user';
import type { MembershipStatus, UserProfile } from '@/types/user';

export default function StaffView() {
    const [staff, setStaff] = useState<UserProfile[]>([]);                  // Fetched staff accounts
    const [loading, setLoading] = useState(true);                           // Whether staff are still being fetched
    const [filter, setFilter] = useState<MembershipStatus | 'all'>('all');  // Current status filter
    const [updating, setUpdating] = useState<string | null>(null);          // ID of the account currently being updated

    // Fetch all non-terminated staff accounts
    const load = useCallback(async () => {
        setLoading(true);
        const all = await getStaffUsers();
        setStaff(all.filter(s => s.membershipStatus !== 'cancelled'));
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    // Function used to update a staff member's membership status
    async function handleStatusChange(uid: string, status: MembershipStatus) {
        setUpdating(uid);
        try {
            await updateUserMembershipStatus(uid, status);
            setStaff(prev =>
                status === 'cancelled'
                    ? prev.filter(s => s.uid !== uid)
                    : prev.map(s => s.uid === uid ? { ...s, membershipStatus: status } : s)
            );
        } finally {
            setUpdating(null);
        }
    }

    // Filter staff accounts by the current status filter
    const visible = filter === 'all' ? staff : staff.filter(s => s.membershipStatus === filter);

    // Render skeleton cards while staff are being fetched
    if (loading) return (
        <div className="max-w-2xl mx-auto space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 rounded-2xl" />
            ))}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            {/* Status filter tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {STATUS_FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={[
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                            filter === f.value
                                ? 'bg-sky-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
                        ].join(' ')}
                    >
                        {f.label}
                        {f.value !== 'all' && (
                            <span className="ml-1.5 opacity-60">
                                {staff.filter(s => s.membershipStatus === f.value).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {visible.length === 0 ? (
                // Render empty state if no staff accounts match the current filter
                <div className="text-center py-16 text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-700">No staff members found.</p>
                    <p className="text-sm mt-1">
                        {filter === 'all' ? 'No staff accounts have been created yet.' : `No ${filter} staff accounts.`}
                    </p>
                </div>
            ) : (
                // Render staff cards
                <div className="space-y-3">
                    {visible.map(member => (
                        <div key={member.uid} className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center gap-4">
                            {/* Avatar */}
                            <div className="shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                                {member.firstName[0]}{member.lastName[0]}
                            </div>

                            {/* Name, email and status pill */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-900 text-sm truncate">
                                        {member.firstName} {member.lastName}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                </div>
                                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${STATUS_BADGE[member.membershipStatus]}`}>
                                    {member.membershipStatus}
                                </span>
                            </div>

                            <div className="flex-1" />

                            {/* Actions */}
                            <div className="flex gap-1.5 shrink-0">
                                {member.membershipStatus === 'pending' && (
                                    <button
                                        onClick={() => handleStatusChange(member.uid, 'active')}
                                        disabled={updating === member.uid}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Approve
                                    </button>
                                )}
                                {member.membershipStatus === 'active' && (
                                    <button
                                        onClick={() => handleStatusChange(member.uid, 'suspended')}
                                        disabled={updating === member.uid}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
                                    >
                                        <ShieldOff className="w-3.5 h-3.5 shrink-0" /> Suspend
                                    </button>
                                )}
                                {member.membershipStatus === 'suspended' && (
                                    <button
                                        onClick={() => handleStatusChange(member.uid, 'active')}
                                        disabled={updating === member.uid}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 shrink-0" /> Reactivate
                                    </button>
                                )}
                                {/* Reject for pending accounts, terminate for all others */}
                                <button
                                    onClick={() => handleStatusChange(member.uid, 'cancelled')}
                                    disabled={updating === member.uid}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
                                >
                                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                                    {member.membershipStatus === 'pending' ? 'Reject' : 'Terminate'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
