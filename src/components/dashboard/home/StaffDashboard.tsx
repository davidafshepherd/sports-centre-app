'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ArrowRight } from 'lucide-react';

import { getBookingRequestsForStaff } from '@/lib/bookingRequests';
import { getBookingsForStaff } from '@/lib/bookings';
import { useAuth } from '@/providers/AuthProvider';
import { formatSlot } from '@/lib/utils/date';
import type { Booking } from '@/types/booking';
import type { BookingRequest } from '@/types/bookingRequest';

import ProfileCard from './ProfileCard';

export default function StaffDashboard() {
    const { user, userProfile } = useAuth();                                        // Access authentication context
    const [pendingRequests, setPendingRequests] = useState<BookingRequest[]>([]);   // All pending booking requests
    const [upcomingSessions, setUpcomingSessions] = useState<Booking[]>([]);        // All upcoming sessions
    const [todaySessions, setTodaySessions] = useState<Booking[]>([]);              // Today's sessions (up to 3)
    const [loading, setLoading] = useState(true);                                   // Whether data is still being fetched

    // Fetch pending requests and upcoming sessions for facilities assigned to the staff member
    useEffect(() => {
        if (!user) return;
        Promise.all([
            getBookingRequestsForStaff(user.uid),
            getBookingsForStaff(user.uid),
        ]).then(([reqs, bookings]) => {
            const today = new Date().toISOString().split('T')[0];
            const upcoming = bookings
                .filter(b => b.status === 'upcoming')
                .sort((a, c) => a.date.localeCompare(c.date) || a.slotStart - c.slotStart);

            setPendingRequests(reqs.filter(r => r.status === 'pending'));
            setUpcomingSessions(upcoming);
            setTodaySessions(upcoming.filter(b => b.date === today).slice(0, 3));
            setLoading(false);
        });
    }, [user]);


    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Welcome heading */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Welcome back, {userProfile?.firstName ?? 'there'}!
                </h1>
                <p className="mt-1 text-slate-500">Here&apos;s your account overview.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">

                {/* Left column: profile card */}
                <ProfileCard />

                {/* Right column: stat cards + today's sessions */}
                <div className="flex flex-col justify-center gap-6">
                    {/* Stat cards: pending requests and upcoming sessions counts */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Pending requests', count: pendingRequests.length, colour: 'text-amber-700 border-amber-200' },
                            { label: 'Upcoming sessions', count: upcomingSessions.length, colour: 'text-sky-700 border-sky-200' },
                        ].map(({ label, count, colour }) => (
                            <div key={label} className={`bg-white rounded-xl border px-4 py-3 ${colour}`}>
                                <p className="text-2xl font-bold">{loading ? '—' : count}</p>
                                <p className="text-xs font-medium mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Today's sessions section */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-slate-700">Today&apos;s sessions</h2>
                            <Link href="/bookings" className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium">
                                View all <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        {loading ? (
                            // Render skeleton while sessions are being fetched
                            <div className="space-y-2 animate-pulse">
                                {[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
                            </div>
                        ) : todaySessions.length === 0 ? (
                            // Render empty state if there are no sessions today
                            <div className="bg-white rounded-xl border border-slate-200 py-10 flex flex-col items-center gap-2 text-slate-400">
                                <CalendarDays className="w-8 h-8 text-slate-200" />
                                <p className="text-sm">No sessions today.</p>
                            </div>
                        ) : (
                            // Today's session cards (up to 3)
                            <div className="space-y-2">
                                {todaySessions.map(b => (
                                    <div key={b.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{b.facilityName}</p>
                                            <p className="text-xs text-slate-500 truncate">{b.memberName} · {formatSlot(b.slotStart, b.slotEnd - b.slotStart)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

            </div>
        </div>
    );
}
