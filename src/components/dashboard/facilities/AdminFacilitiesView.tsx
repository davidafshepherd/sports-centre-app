'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus } from 'lucide-react';

import { getFacilities } from '@/lib/facilities';
import type { Facility } from '@/types/facility';

import AdminFacilityCard from './AdminFacilityCard';
import FacilityFormModal from './modals/FacilityFormModal';
import RemoveFacilityModal from './modals/RemoveFacilityModal';

export default function AdminFacilitiesView() {
    const [facilities, setFacilities] = useState<Facility[]>([]);                           // All facilities
    const [loading, setLoading] = useState(true);                                           // Whether data is still being fetched
    const [loadKey, setLoadKey] = useState(0);                                              // Counter incremented to trigger a re-fetch
    const reload = useCallback(() => { setLoading(true); setLoadKey(k => k + 1); }, []);    // Trigger a data re-fetch

    const [createOpen, setCreateOpen] = useState(false);                        // Whether the create facility modal is open
    const [editTarget, setEditTarget] = useState<Facility | null>(null);        // Facility staged for editing
    const [removeTarget, setRemoveTarget] = useState<Facility | null>(null);    // Facility staged for removal

    // Fetch all facilities (including inactive ones) from Firestore
    useEffect(() => {
        getFacilities()
            .then(setFacilities)
            .finally(() => setLoading(false));
    }, [loadKey]);

    // Render skeleton cards while facilities are being fetched
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-9 w-36 bg-slate-200 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-72 bg-slate-200 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    {/* Number of available facilities */}
                    <p className="text-sm text-slate-500">
                        {facilities.length} {facilities.length === 1 ? 'facility' : 'facilities'}
                    </p>
                    {/* Create facility button */}
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Create Facility
                    </button>
                </div>

                {facilities.length === 0 ? (
                    // Render empty state if there are no available facilities
                    <div className="text-center py-20 text-slate-500">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                        <p className="font-medium text-slate-400">No facilities yet.</p>
                    </div>
                ) : (
                    // Render facility cards
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {facilities.map((f, i) => (
                            <AdminFacilityCard
                                key={f.id}
                                facility={f}
                                priority={i < 3}
                                onEdit={setEditTarget}
                                onRemove={setRemoveTarget}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create facility modal */}
            {createOpen && (
                <FacilityFormModal
                    facility={null}
                    onClose={() => setCreateOpen(false)}
                    onDone={() => { setCreateOpen(false); reload(); }}
                />
            )}

            {/* Edit facility modal */}
            {editTarget && (
                <FacilityFormModal
                    facility={editTarget}
                    onClose={() => setEditTarget(null)}
                    onDone={() => { setEditTarget(null); reload(); }}
                />
            )}

            {/* Delete facility modal */}
            {removeTarget && (
                <RemoveFacilityModal
                    facility={removeTarget}
                    onClose={() => setRemoveTarget(null)}
                    onDone={() => { setRemoveTarget(null); reload(); }}
                />
            )}
        </>
    );
}
