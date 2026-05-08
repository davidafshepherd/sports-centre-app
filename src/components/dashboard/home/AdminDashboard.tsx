'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { getStaffUsers } from '@/lib/users';
import { useAuth } from '@/providers/AuthProvider';
import type { UserProfile } from '@/types/user';

import ProfileCard from './ProfileCard';

export default function AdminDashboard() {
    const { userProfile } = useAuth();                      // Access authentication context
    const [staff, setStaff] = useState<UserProfile[]>([]);  // All non-terminated staff accounts
    const [loading, setLoading] = useState(true);           // Whether staff accounts are still being fetched

    // Fetch all non-terminated staff accounts from Firestore
    useEffect(() => {
        getStaffUsers().then(all => {
            setStaff(all.filter(s => s.membershipStatus !== 'cancelled'));
            setLoading(false);
        });
    }, []);

    // Derive counts from the fetched staff accounts
    const activeCount = staff.filter(s => s.membershipStatus === 'active').length;
    const pendingCount = staff.filter(s => s.membershipStatus === 'pending').length;
    const suspendedCount = staff.filter(s => s.membershipStatus === 'suspended').length;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Welcome heading */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Welcome back, {userProfile?.firstName ?? 'there'}!
                </h1>
                <p className="mt-1 text-slate-500">Here&apos;s your account overview.</p>
            </div>

            {/* Profile card */}
            <ProfileCard />

            {/* Staff overview section */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-700">Staff overview</h2>
                    <Link href="/staff" className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium">
                        Manage staff <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* Stat cards: active, pending and suspended staff counts */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Active', count: activeCount, colour: 'text-emerald-700 border-emerald-200' },
                        { label: 'Pending', count: pendingCount, colour: 'text-sky-700 border-sky-200' },
                        { label: 'Suspended', count: suspendedCount, colour: 'text-amber-700 border-amber-200' },
                    ].map(({ label, count, colour }) => (
                        <div key={label} className={`bg-white rounded-xl border px-4 py-3 ${colour}`}>
                            <p className="text-2xl font-bold">{loading ? '—' : count}</p>
                            <p className="text-xs font-medium mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
