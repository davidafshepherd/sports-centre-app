import { 
    collection, 
    doc, 
    getDocs, 
    updateDoc, 
    query, 
    where,
} from 'firebase/firestore';

import { getFacilitiesForStaff } from '@/lib/facilities';
import { db } from '@/lib/firebase';
import { createNotification } from '@/lib/notifications';
import { formatDate } from '@/lib/utils/date';
import type { Booking } from '@/types/booking';

/**
 * Gets all bookings for a member.
 * @param memberId Member's ID.
 * @returns List of bookings sorted by newest first.
 */
export async function getBookingsForMember(memberId: string): Promise<Booking[]> {
    // Fetch all bookings belonging to the member from Firestore
    const q = query(collection(db, 'bookings'), where('memberId', '==', memberId));
    const snap = await getDocs(q);

    // Convert Firestore documents into Booking objects
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Booking))
        .sort((a, b) => b.date.localeCompare(a.date) || b.slotStart - a.slotStart);
}

/**
 * Gets all upcoming bookings for a facility.
 * @param facilityId Facility's ID.
 * @returns List of upcoming bookings for the facility.
 */
export async function getUpcomingBookingsForFacility(facilityId: string): Promise<Booking[]> {
    // Fetch all bookings for the facility from Firestore
    const q = query(collection(db, 'bookings'), where('facilityId', '==', facilityId));
    const snap = await getDocs(q);

    // Convert Firestore documents into Booking objects + filter by status
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Booking))
        .filter(b => b.status === 'upcoming');
}

/**
 * Gets all upcoming bookings for a facility on a specifc date. 
 * @param facilityId Facility's ID.
 * @param date Date in YYYY-MM-DD format.
 * @returns List of upcoming bookings for the facility on the date.
 */
export async function getBookingsForFacility(facilityId: string, date: string): Promise<Booking[]> {
    // Fetch all bookings for the facility from Firestore
    const q = query(collection(db, 'bookings'), where('facilityId', '==', facilityId));
    const snap = await getDocs(q);

    // Convert Firestore documents into Booking objects + filter by date and status
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Booking))
        .filter(b => b.date === date && b.status === 'upcoming');
}

/**
 * Gets all bookings for facilities assigned to a staff member.
 * @param staffId Staff member's ID.
 * @returns List of bookings sorted by newest first.
 */
export async function getBookingsForStaff(staffId: string): Promise<Booking[]> {
    // Fetch all facilities assigned to the staff member
    const facilities = await getFacilitiesForStaff(staffId);

    // If no facilities are assigned to the staff member, return an empty array
    if (facilities.length === 0) return [];

    // Fetch all bookings for the facilities fetched from Firestore
    const facilityIds = facilities.map(f => f.id);
    const q = query(collection(db, 'bookings'), where('facilityId', 'in', facilityIds));
    const snap = await getDocs(q);

    // Convert Firestore documents into Booking objects
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Booking))
        .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Marks a booking as completed.
 * @param bookingId Booking's ID.
 * @param booking Booking.
 * @param staffId Staff member's ID.
 */
export async function markBookingComplete(
    bookingId: string,
    booking: Booking,
    staffId: string,
): Promise<void> {
    // Create ISO datetime string for the update
    const now = new Date().toISOString();

    // Mark the booking as completed
    await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        completedBy: staffId,
        updatedAt: now,
    });

    // Notify the member that their session has been completed
    await createNotification({
        userId: booking.memberId,
        type: 'booking_completed',
        title: 'Session Completed',
        message: `Your session at ${booking.facilityName} on ${formatDate(booking.date)} has been marked as completed.`,
        relatedId: bookingId,
        relatedType: 'booking',
    });
}

/**
 * Cancels a booking.
 * @param bookingId Booking's ID.
 */
export async function cancelBooking(bookingId: string): Promise<void> {
    await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
    });
}
