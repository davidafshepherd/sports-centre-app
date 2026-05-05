'use client';

import { useCallback, useEffect, useState } from 'react';

import { getBookingRequestsForStaff } from '@/lib/bookingRequests';
import { getBookingsForStaff, getUpcomingBookingsForFacility } from '@/lib/bookings';
import { getActiveFacilities } from '@/lib/facilities';
import { useAuth } from '@/providers/AuthProvider';
import type { BookingRequest } from '@/types/bookingRequest';
import type { Booking } from '@/types/booking';
import type { Facility } from '@/types/facility';
import { getNext7Dates, getTotalSlots } from '@/lib/utils/slots';

import BookingTabs from './BookingTabs';
import { BookingLoadingSkeleton } from './BookingEmptyState';
import StaffPendingTab from './tabs/StaffPendingTab';
import StaffSessionsTab from './tabs/StaffSessionsTab';

export default function StaffBookingsView() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<BookingRequest[]>([]);                                                             // Pending booking requests
    const [bookings, setBookings] = useState<Booking[]>([]);                                                                    // Upcoming sessions
    const [allFacilities, setAllFacilities] = useState<Facility[]>([]);                                                         // All active facilities
    const [facilityAvailability, setFacilityAvailability] = useState<Record<string, { booked: number; total: number }>>({});    // Availability stats per facility
    const [tab, setTab] = useState('pending');                                                                                  // Active tab id
    const [loading, setLoading] = useState(true);                                                                               // Whether data is still being fetched
    const [loadKey, setLoadKey] = useState(0);                                                                                  // Counter incremented to trigger a re-fetch
    const load = useCallback(() => setLoadKey(k => k + 1), []);                                                                 // Trigger a data re-fetch

    // Fetch all data from Firestore
    useEffect(() => {
        if (!user) return;
        Promise.all([
            getBookingRequestsForStaff(user.uid),
            getBookingsForStaff(user.uid),
            getActiveFacilities(),
        ]).then(([reqs, bkgs, facilities]) => {
            setRequests(reqs);
            setBookings(bkgs);
            setAllFacilities(facilities);
            setLoading(false);

            // Fetch availability for facilities with pending requests
            const pendingFacilityIds = [...new Set(
                reqs.filter(r => r.status === 'pending').map(r => r.facilityId)
            )];
            if (pendingFacilityIds.length === 0) return;
            const dates = getNext7Dates();
            const facilityMap = Object.fromEntries(facilities.map(f => [f.id, f]));
            Promise.all(
                pendingFacilityIds.map(fid =>
                    getUpcomingBookingsForFacility(fid).then(bkgs => {
                        const facility = facilityMap[fid];
                        if (!facility) return null;
                        const booked = bkgs.filter(b => dates.includes(b.date)).length;
                        const total = getTotalSlots(facility, dates);
                        return [fid, { booked, total }] as const;
                    })
                )
            ).then(entries => {
                setFacilityAvailability(
                    Object.fromEntries(entries.filter(Boolean) as [string, { booked: number; total: number }][])
                );
            });
        });
    }, [user, loadKey]);

    // Derive maps and subsets for each tab
    const facilityMap = Object.fromEntries(allFacilities.map(f => [f.id, f]));
    const pending = requests.filter(r => r.status === 'pending');
    const sessions = bookings.filter(b => b.status === 'upcoming');

    // Tab definitions
    const tabs = [
        { id: 'pending', label: 'Pending', count: pending.length },
        { id: 'sessions', label: 'Sessions', count: sessions.length },
    ];

    // Render skeleton while data is being fetched
    if (loading) return <BookingLoadingSkeleton />;

    return (
        <>
            {/* Tab navigation */}
            <BookingTabs tabs={tabs} active={tab} onChange={setTab} />

            {/* Pending tab - requests awaiting review */}
            {tab === 'pending' && (
                <StaffPendingTab
                    requests={pending}
                    allFacilities={allFacilities}
                    facilityMap={facilityMap}
                    facilityAvailability={facilityAvailability}
                    onLoad={load}
                />
            )}

            {/* Sessions tab - confirmed upcoming sessions */}
            {tab === 'sessions' && (
                <StaffSessionsTab
                    bookings={sessions}
                    facilityMap={facilityMap}
                    onLoad={load}
                />
            )}
        </>
    );
}
