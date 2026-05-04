'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getBookingRequestsForMember } from '@/lib/bookingRequests';
import { getFacilityById } from '@/lib/facilities';
import { useAuth } from '@/providers/AuthProvider';
import { ACTIVE_REQUEST_STATUSES, ACTIVE_STATUS_UI } from '@/types/bookingRequest';
import type { BookingRequest } from '@/types/bookingRequest';
import { CATEGORY_CONFIG } from '@/types/facility';
import type { Facility } from '@/types/facility';

import BookingRequestFormCard from './BookingRequestForm';
import FacilityDetailsCard from './FacilityDetailsCard';

// Shape of component's props
interface Props {
    facilityId: string; // Facility's ID
}

export default function FacilityDetailsView({ facilityId }: Props) {
    // Access authentication context + router + user's role
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const role = userProfile?.role;

    const [facility, setFacility] = useState<Facility | null>(null);                                    // Facility
    const [loading, setLoading] = useState(true);                                                       // Whether the facility is still being fetched
    const [showBookingRequest, setShowBookingRequest] = useState(false);                                // Whether the booking request modal is open
    const [activeRequest, setActiveRequest] = useState<BookingRequest | null | undefined>(undefined);   // Member's current request for this facility 

    // Fetch facility from Firestore
    useEffect(() => {
        getFacilityById(facilityId).then((f) => {
            if (!f) { 
                router.replace("/facilities"); 
                return; 
            }

            setFacility(f);
            setLoading(false);
        });
    }, [facilityId, router]);

    // Fetches the member's booking request for the current facility (if it exists and active)
    useEffect(() => {
        if (!user || role !== "member") return;

        // Fetch member's latest booking requests
        getBookingRequestsForMember(user.uid).then((requests) => {
            const found = requests.find((r) => {
                // Check if the request is for the current facility and is active
                const match = r.facilityId === facilityId;
                const active_request = (ACTIVE_REQUEST_STATUSES as readonly string[]).includes(r.status);
                return match && active_request;
            });

            // Store active request or null if none exists
            setActiveRequest(found ?? null);
        });
    }, [user, facilityId, role])

    // Function used to re-fetch the member's booking request for the current facility (if it exists and active)
    function refreshActiveRequest() {
        if (!user) return;
        
        // Fetch member's latest booking requests
        getBookingRequestsForMember(user.uid).then((requests) => {
            // Find an active request for the current facility
            const found = requests.find((r) => {
                    // Check if the request is for the current facility and is active
                    const match = r.facilityId == facilityId;
                    const active_request = (ACTIVE_REQUEST_STATUSES as readonly string[]).includes(r.status);
                    return match && active_request;
                });

            // Store active request or null if none exists
            setActiveRequest(found ?? null);
        });
    }

    // Render placeholder while facility is being fetched
    if (loading) {
        return (
            <div className="space-y-4 animate-pulse max-w-2xl">
                <div className="h-56 bg-slate-200 rounded-2xl" />
                <div className="h-64 bg-slate-200 rounded-2xl" />
            </div>
        );
    }

    // Render nothing if the facility failed to load
    if (!facility) return null;

    // Facility's configuration
    const cfg = CATEGORY_CONFIG[facility.category];

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            {/* Faciliy details card */}
            <FacilityDetailsCard facility={facility} />

            {/* Booking section (members only) */}
            {role === "member" && (() => {
                {/* Render inactive message if facility is inactive */}
                if (!facility.isActive) {
                    return (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700">
                            This facility is currently inactive and cannot be booked.
                        </div>
                    );
                }
                {/* Render placeholder if still checking for an active request */}
                if (activeRequest === undefined) {
                    return (
                        <div className="animate-pulse h-12 bg-slate-200 rounded-2xl" />
                    );
                }
                {/* Render booking section */}
                return (
                    <div className="space-y-2">
                        {/* Request a booking button */}    
                        <button
                            disabled={!!activeRequest}
                            className={`w-full py-3 rounded-2xl text-sm font-semibold text-white transition-colors shadow-sm ${cfg.bg} hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                            onClick={() => setShowBookingRequest(true)}
                        >
                            Request a Booking
                        </button>
                        {/* Display message if there is an active request */}
                        {activeRequest && (
                            <p className="text-sm text-center text-slate-500">
                                {ACTIVE_STATUS_UI[activeRequest.status as keyof typeof ACTIVE_STATUS_UI].beforeText}
                                <Link href="/bookings" className="text-sky-900 hover:text-sky-800 underline">
                                    {ACTIVE_STATUS_UI[activeRequest.status as keyof typeof ACTIVE_STATUS_UI].linkText}
                                </Link>
                                {ACTIVE_STATUS_UI[activeRequest.status as keyof typeof ACTIVE_STATUS_UI].afterText}
                            </p>
                        )}
                    </div>
                );
            })()}

            {/* Booking request modal */}
            {showBookingRequest && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
                    <div
                        className="flex min-h-full items-center justify-center p-4 py-8"
                        onClick={(e) => { 
                            // Close booking request modal when clicking outside the form
                            if (e.target === e.currentTarget) setShowBookingRequest(false);
                        }}
                    >
                        {/* Booking request form */}
                        <BookingRequestFormCard
                            facility={facility}
                            onClose={() => setShowBookingRequest(false)}
                            onSuccess={refreshActiveRequest}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
