'use client';

import { useCallback, useEffect, useState } from 'react';

import { getBookingRequestsForMember } from '@/lib/bookingRequests';
import { getBookingsForMember } from '@/lib/bookings';
import { getActiveFacilities } from '@/lib/facilities';
import { useAuth } from '@/providers/AuthProvider';
import type { BookingRequest } from '@/types/bookingRequest';
import type { Booking } from '@/types/booking';
import type { Facility } from '@/types/facility';

import BookingTabs from './BookingTabs';
import { BookingLoadingSkeleton } from './BookingEmptyState';
import MemberRequestsTab from './tabs/MemberRequestsTab';
import MemberUpcomingTab from './tabs/MemberUpcomingTab';
import MemberHistoryTab from './tabs/MemberHistoryTab';

export default function MemberBookingsView() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);                        // Member's bookings
    const [requests, setRequests] = useState<BookingRequest[]>([]);                 // Member's booking requests
    const [facilityMap, setFacilityMap] = useState<Record<string, Facility>>({});   // Facility id -> facility
    const [tab, setTab] = useState('requests');                                     // Active tab id
    const [loading, setLoading] = useState(true);                                   // Whether data is still being fetched
    const [loadKey, setLoadKey] = useState(0);                                      // Counter incremented to trigger a re-fetch
    const load = useCallback(() => setLoadKey(k => k + 1), []);                     // Trigger a data re-fetch

    // Fetch all data from Firestore
    useEffect(() => {
        if (!user) return;
        Promise.all([
            getBookingsForMember(user.uid),
            getBookingRequestsForMember(user.uid),
            getActiveFacilities(),
        ]).then(([b, r, facilities]) => {
            setBookings(b);
            setRequests(r);
            setFacilityMap(Object.fromEntries(facilities.map(f => [f.id, f])));
            setLoading(false);
        });
    }, [user, loadKey]);

    // Derive filtered subsets for each tab
    const actionableRequests = requests.filter(r =>
        ['pending', 'approved', 'alternative_suggested'].includes(r.status),
    );
    const upcomingBookings = bookings.filter(b => b.status === 'upcoming');
    const historyBookings = bookings.filter(b => b.status !== 'upcoming');

    // Tab definitions
    const tabs = [
        { id: 'requests', label: 'Requests', count: actionableRequests.length },
        { id: 'upcoming', label: 'Upcoming', count: upcomingBookings.length },
        { id: 'history', label: 'History' },
    ];

    // Render skeleton while data is being fetched
    if (loading) return <BookingLoadingSkeleton />;

    return (
        <>
            {/* Tab navigation */}
            <BookingTabs tabs={tabs} active={tab} onChange={setTab} />

            {/* Requests tab - actionable and recently rejected requests */}
            {tab === 'requests' && (
                <MemberRequestsTab requests={requests} facilityMap={facilityMap} onLoad={load} />
            )}

            {/* Upcoming tab - confirmed upcoming bookings */}
            {tab === 'upcoming' && (
                <MemberUpcomingTab bookings={upcomingBookings} facilityMap={facilityMap} onLoad={load} />
            )}

            {/* History tab - past and cancelled bookings */}
            {tab === 'history' && (
                <MemberHistoryTab bookings={historyBookings} facilityMap={facilityMap} />
            )}
        </>
    );
}
