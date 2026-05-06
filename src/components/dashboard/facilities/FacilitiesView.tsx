'use client';

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

import { getActiveFacilities } from '@/lib/facilities';
import type { Facility } from '@/types/facility';

import FacilityCard from './FacilityCard';

export default function FacilitiesView() {
    const [facilities, setFacilities] = useState<Facility[]>([]);   // Fetched facilities
    const [loading, setLoading] = useState(true);                   // Whether facilities are still being fetched

    // Fetch facilities from Firestore
    useEffect(() => {
        getActiveFacilities()
            .then((f) => {
                setFacilities(f);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Render skeleton cards while facilities are being fetched
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
                {Array.from({length: 6}).map((_, index) => (
                    <div key={index} className="h-64 bg-slate-200 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Number of available facilities */}
            <p className="text-sm text-slate-500">
                {facilities.length} available
            </p>

            {facilities.length === 0 ? (
                // Render empty state if there are no available facilities
                <div className="text-center py-20 text-slate-500">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p className="font-medium text-slate-400">No facilities found.</p>
                </div>
            ) : (
                // Render facility cards
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {facilities.map((f, i) => (
                        <FacilityCard key={f.id} facility={f} priority={i < 3} />
                    ))}
                </div>
            )}
        </div>
    );
}
