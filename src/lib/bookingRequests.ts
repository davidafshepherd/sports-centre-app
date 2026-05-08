import { 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where,
} from 'firebase/firestore';

import { getFacilitiesForStaff, getFacilityById } from '@/lib/facilities';
import { db } from '@/lib/firebase';
import { createNotification } from '@/lib/notifications';
import { formatDate, formatSlot } from '@/lib/utils/date';
import type { BookingRequest } from '@/types/bookingRequest';

/**
 * Creates a new booking request.
 * @param data Booking request's fields, excluding auto-generated fields.
 * @returns Created booking request's ID.
 */
export async function createBookingRequest(
    data: Omit<BookingRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>, 
): Promise<string> {
    // Create ISO datetime string for audit fields
    const now = new Date().toISOString();

    // Add new booking request document to Firestore
    const ref = await addDoc(collection(db, 'bookingRequests'), {
        ...data,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
    });

    // Fetch the requested facility to notify assigned staff members
    const facility = await getFacilityById(data.facilityId);

    // Notify all staff members assigned to the facility
    if (facility && facility.assignedStaffIds.length > 0) {
        await Promise.all(facility.assignedStaffIds.map(staffId =>
            createNotification({
                userId: staffId,
                type: 'booking_request_received',
                title: 'New Booking Request',
                message: `${data.memberName} has submitted a booking request for ${data.facilityName}.`,
                relatedId: ref.id,
                relatedType: 'bookingRequest',
            }),
        ));
    }

    // Return the booking request's ID
    return ref.id;
}

/**
 * Gets all booking requests for a member.
 * @param memberId Member's ID.
 * @returns List of booking requests sorted by newest first. 
 */
export async function getBookingRequestsForMember(memberId: string): Promise<BookingRequest[]> {
    // Fetch all booking requests belonging to the member from Firestore
    const q = query(collection(db, 'bookingRequests'), where('memberId', '==', memberId));
    const snap = await getDocs(q);

    // Convert Firestore documents into BookingRequest objects
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as BookingRequest))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Gets all booking requests for facilities assigned to a staff member.
 * @param staffId Staff member's ID.
 * @returns List of booking requests sorted by newest first.
 */
export async function getBookingRequestsForStaff(staffId: string): Promise<BookingRequest[]> {
    // Fetch all facilities assigned to the staff member
    const facilities = await getFacilitiesForStaff(staffId);

    // If no facilities are assigned to the staff member, return an empty array
    if (facilities.length === 0) return [];
    
    // Fetch all booking requests for the facilities fetched from Firestore
    const facilityIds = facilities.map(f => f.id);
    const q = query(collection(db, 'bookingRequests'), where('facilityId', 'in', facilityIds));
    const snap = await getDocs(q);

    // Convert Firestore documents into BookingRequest objects
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as BookingRequest))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Approves a booking request.
 * @param requestId Booking request's ID.
 * @param request Booking request.
 * @param staffId Staff member's ID.
 */
export async function approveBookingRequest(
    requestId: string,
    request: BookingRequest,
    staffId: string,
): Promise<void> {
    // Create ISO datetime string for the update
    const now = new Date().toISOString();

    // Mark the booking request as approved
    await updateDoc(doc(db, 'bookingRequests', requestId), {
        status: 'approved',
        reviewedBy: staffId,
        updatedAt: now,
    });

    // Notify the member that they can now select a time slot
    await createNotification({
        userId: request.memberId,
        type: 'booking_approved',
        title: 'Request Approved',
        message: `Your booking request for ${request.facilityName} has been approved. Please select a time slot to confirm your booking.`,
        relatedId: requestId,
        relatedType: 'bookingRequest',
    });
}

/**
 * Rejects a booking request.
 * @param requestId Booking request's ID.
 * @param request Booking request.
 * @param staffId Staff member's ID.
 * @param note Rejection reason.
 */
export async function rejectBookingRequest(
    requestId: string,
    request: BookingRequest,
    staffId: string,
    note: string,
): Promise<void> {
    // Create ISO datetime string for the update
    const now = new Date().toISOString();

    // Mark the booking request as rejected
    await updateDoc(doc(db, 'bookingRequests', requestId), {
        status: 'rejected',
        reviewedBy: staffId,
        reviewNote: note,
        updatedAt: now,
    });

    // Notify the member that their request has been rejected
    await createNotification({
        userId: request.memberId,
        type: 'booking_rejected',
        title: 'Booking Declined',
        message: `Your booking request for ${request.facilityName} was declined.${note ? ` Reason: ${note}` : ""}`,
        relatedId: requestId,
        relatedType: 'bookingRequest',
    });
}

/**
 * Confirms a booking slot and creates a booking.
 * @param requestId Booking request's ID.
 * @param request Booking request.
 * @param date Slot date in YYYY-MM-DD format.
 * @param slotStart Slot start time in minutes from midnight.
 * @param slotDurationMins Slot duration in minutes.
 */
export async function confirmBookingSlot(
    requestId: string,
    request: BookingRequest,
    date: string,
    slotStart: number,
    slotDurationMins: number,
): Promise<void> {
    // Create ISO datetime string for audit fields
    const now = new Date().toISOString();

    // Create the booking
    const bookingRef = await addDoc(collection(db, 'bookings'), {
        memberId: request.memberId,
        memberName: request.memberName,
        memberEmail: request.memberEmail,
        facilityId: request.facilityId,
        facilityName: request.facilityName,
        date,
        slotStart,
        slotEnd: slotStart + slotDurationMins,
        activityDescription: request.activityDescription,
        status: 'upcoming',
        createdAt: now,
        updatedAt: now,
    });

    // Delete the booking request
    await deleteDoc(doc(db, 'bookingRequests', requestId));

    // Fetch the booked facility to notify assigned staff members
    const facility = await getFacilityById(request.facilityId);

    // Notify all staff members assigned to the facility
    if (facility && facility.assignedStaffIds.length > 0) {
        await Promise.all(facility.assignedStaffIds.map(staffId =>
            createNotification({
                userId: staffId,
                type: 'booking_confirmed_staff',
                title: 'Booking Confirmed',
                message: `${request.memberName} has confirmed a booking at ${request.facilityName} on ${formatDate(date)} at ${formatSlot(slotStart, slotDurationMins)}.`,
                relatedId: bookingRef.id,
                relatedType: 'booking',
            }),
        ));
    }
}

/**
 * Suggest an alternative facility for a booking request.
 * @param requestId Booking request's ID.
 * @param request Booking request.
 * @param staffId Staff member's ID.
 * @param suggestion Alternative facility suggestion.
 */
export async function suggestAlternative(
    requestId: string,
    request: BookingRequest,
    staffId: string,
    suggestion: {
        facilityId: string;
        facilityName: string;
        note: string;
    },
): Promise<void> {
    // Create ISO datetime string for the update
    const now = new Date().toISOString();

    // Update booking request
    await updateDoc(doc(db, 'bookingRequests', requestId), {
        status: 'alternative_suggested',
        reviewedBy: staffId,
        reviewNote: suggestion.note,
        suggestedFacilityId: suggestion.facilityId,
        suggestedFacilityName: suggestion.facilityName,
        updatedAt: now,
    });

    // Notify the member that an alternative facility has been suggested
    await createNotification({
        userId: request.memberId,
        type: 'booking_alternative',
        title: 'Alternative Facility Suggested',
        message: `Staff suggested an alternative facility: ${suggestion.facilityName}. Accept or decline in your bookings.`,
        relatedId: requestId,
        relatedType: 'bookingRequest',
    });
}

/**
 * Accepts an alternative facility suggestion.
 * @param requestId Booking request's ID.
 * @param request Booking request.
 */
export async function acceptAlternativeSuggestion(
    requestId: string,
    request: BookingRequest,
): Promise<void> {
    // Store the suggested facility if available
    const facilityId = request.suggestedFacilityId ?? request.facilityId;
    const facilityName = request.suggestedFacilityName ?? request.facilityName;

    // Mark the booking request as approved using the suggested facility
    await updateDoc(doc(db, 'bookingRequests', requestId), {
        status: 'approved',
        facilityId,
        facilityName,
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Rejects an alternative facility suggestion.
 * @param requestId Booking request's ID.
 */
export async function rejectAlternativeSuggestion(requestId: string): Promise<void> {
    await deleteDoc(doc(db, 'bookingRequests', requestId));
}

/**
 * Cancels a booking request.
 * @param requestId Booking request's ID.
 */
export async function cancelBookingRequest(requestId: string): Promise<void> {
    await deleteDoc(doc(db, 'bookingRequests', requestId));
}

/**
 * Gets all booking requests for a facility.
 * @param facilityId Facility's ID.
 * @returns List of booking requests for the facility.
 */
export async function getBookingRequestsForFacility(facilityId: string): Promise<BookingRequest[]> {
    const q = query(collection(db, 'bookingRequests'), where('facilityId', '==', facilityId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as BookingRequest));
}

/**
 * Cancels (deletes) all booking requests for a facility.
 * Used when a facility is removed or deactivated.
 * @param facilityId Facility's ID.
 */
export async function cancelBookingRequestsForFacility(facilityId: string): Promise<void> {
    const q = query(collection(db, 'bookingRequests'), where('facilityId', '==', facilityId));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}
