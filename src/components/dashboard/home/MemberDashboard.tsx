'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, XCircle, ArrowRight } from 'lucide-react';

import { getBookingsForMember, cancelBooking } from '@/lib/bookings';
import { getBookingRequestsForMember } from '@/lib/bookingRequests';
import { useAuth } from '@/providers/AuthProvider';
import { formatSlot } from '@/lib/utils/date';
import type { Booking } from '@/types/booking';
import type { BookingRequest } from '@/types/bookingRequest';

import ProfileCard from './ProfileCard';

export default function MemberDashboard() {
    const { user, userProfile } = useAuth();                                      // Access authentication ontext
    const [activeRequests, setActiveRequests] = useState<BookingRequest[]>([]);   // All active booking requests
    const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);      // All upcoming bookings
    const [todayBookings, setTodayBookings] = useState<Booking[]>([]);            // Today's upcoming bookings (up to 3)
    const [loading, setLoading] = useState(true);                                 // Whether data is still being fetched

    const [cancelling, setCancelling] = useState<string | null>(null);                      // ID of the booking being cancelled
    const [loadKey, setLoadKey] = useState(0);                                              // Counter incremented to trigger a re-fetch
    const reload = useCallback(() => { setLoading(true); setLoadKey(k => k + 1); }, []);    // Trigger a data re-fetch

    // Fetch the member's active booking requests and upcoming bookings from Firestore
    useEffect(() => {
        if (!user) return;
        Promise.all([
            getBookingsForMember(user.uid),
            getBookingRequestsForMember(user.uid),
        ]).then(([b, r]) => {
            const today = new Date().toISOString().split('T')[0];
            const upcoming = b
                .filter(x => x.status === 'upcoming')
                .sort((a, c) => a.date.localeCompare(c.date) || a.slotStart - c.slotStart);

            setUpcomingBookings(upcoming);
            setTodayBookings(upcoming.filter(x => x.date === today).slice(0, 3));
            setActiveRequests(r.filter(x => ['pending', 'approved', 'alternative_suggested'].includes(x.status)));
            setLoading(false);
        });
    }, [user, loadKey]);

    // Function used to cancel an upcoming booking
    async function handleCancel(id: string) {
        setCancelling(id);
        await cancelBooking(id);
        setCancelling(null);
        reload();
    }

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

            {/* Stat cards: active requests and upcoming bookings counts */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Active requests', count: activeRequests.length, colour: 'text-amber-700 border-amber-200' },
                    { label: 'Upcoming bookings', count: upcomingBookings.length, colour: 'text-sky-700 border-sky-200' },
                ].map(({ label, count, colour }) => (
                    <div key={label} className={`bg-white rounded-xl border px-4 py-3 ${colour}`}>
                        <p className="text-2xl font-bold">{loading ? '—' : count}</p>
                        <p className="text-xs font-medium mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Today's bookings section */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-700">Today&apos;s bookings</h2>
                    <Link href="/bookings" className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium">
                        View all <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
                {loading ? (
                    // Render skeleton while sessions are being fetched
                    <div className="space-y-2 animate-pulse">
                        {[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
                    </div>
                ) : todayBookings.length === 0 ? (
                    // Render empty state if there are no bookings today
                    <div className="bg-white rounded-xl border border-slate-200 py-10 flex flex-col items-center gap-2 text-slate-400">
                        <CalendarDays className="w-8 h-8 text-slate-200" />
                        <p className="text-sm">No bookings today.</p>
                    </div>
                ) : (
                    // Today's booking cards (up to 3)
                    <div className="space-y-2">
                        {todayBookings.map(b => (
                            <div key={b.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{b.facilityName}</p>
                                    <p className="text-xs text-slate-500">{formatSlot(b.slotStart, b.slotEnd - b.slotStart)}</p>
                                </div>
                                <button
                                    onClick={() => handleCancel(b.id)}
                                    disabled={cancelling === b.id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:enabled:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap shrink-0"
                                >
                                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                                    {cancelling === b.id ? 'Cancelling…' : 'Cancel'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
