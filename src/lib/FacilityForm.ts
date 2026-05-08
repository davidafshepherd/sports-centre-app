import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { createNotification } from '@/lib/notifications';
import { formatDate } from '@/lib/utils/date';
import { getDayFromDate, parseTimeToMins } from '@/lib/utils/slots';
import { getUpcomingBookingsForFacility } from '@/lib/bookings';
import { cancelBookingRequestsForFacility, getBookingRequestsForFacility } from '@/lib/bookingRequests';
import { getUsersByIds } from '@/lib/users';
import type { Facility, OpeningHours } from '@/types/facility';
import type { Booking } from '@/types/booking';
import type { FacilityForm } from '@/lib/schemas/facilityFormSchema';

// Returns true if the booking's slot falls outside the given opening hours
function bookingFallsOutsideHours(booking: Booking, openingHours: OpeningHours): boolean {
    const day = getDayFromDate(booking.date);
    const h = openingHours[day];
    if (!h) return true;
    const openMins = parseTimeToMins(h.open);
    const closeMins = parseTimeToMins(h.close);
    return booking.slotStart < openMins || booking.slotEnd > closeMins;
}

// Per-booking cancel reason for the notification message
function getCancelReason(booking: Booking, current: Facility, next: FacilityForm): string {
    if (!next.isActive) return 'the facility being deactivated';
    if (bookingFallsOutsideHours(booking, next.openingHours)) return 'a change in opening hours';
    if (next.slotDurationMins !== current.slotDurationMins) return 'a change in slot duration';
    return 'a reduction in capacity';
}

// Computes which booking IDs would be cancelled by the config change (dry-run)
function computeCancelledIds(bookings: Booking[], current: Facility, next: FacilityForm): Set<string> {
    const cancelledIds = new Set<string>();

    // Deactivation: cancel all upcoming bookings
    if (!next.isActive) {
        bookings.forEach(b => cancelledIds.add(b.id));
        return cancelledIds;
    }

    // Opening hours change: cancel bookings whose slot falls outside new hours
    for (const b of bookings) {
        if (bookingFallsOutsideHours(b, next.openingHours)) cancelledIds.add(b.id);
    }

    // Slot duration or capacity change: cancel over-capacity bookings using overlap detection
    // against the new slot grid (a booking occupies every new slot it overlaps)
    if (next.slotDurationMins !== current.slotDurationMins || next.maxCapacity < current.maxCapacity) {
        // Build the new slot grid for each date that has surviving bookings
        const dateToSlots = new Map<string, Array<[number, number]>>();
        for (const b of bookings) {
            if (cancelledIds.has(b.id) || dateToSlots.has(b.date)) continue;
            const day = getDayFromDate(b.date);
            const h = next.openingHours[day];
            if (!h) continue;
            const open = parseTimeToMins(h.open);
            const close = parseTimeToMins(h.close);
            const slots: Array<[number, number]> = [];
            for (let s = open; s + next.slotDurationMins <= close; s += next.slotDurationMins) {
                slots.push([s, s + next.slotDurationMins]);
            }
            dateToSlots.set(b.date, slots);
        }
        // For each slot, cancel the most recently-booked excess (re-check cancelledIds each time
        // so a booking cancelled for an earlier slot isn't double-counted in a later one)
        for (const [date, slots] of dateToSlots) {
            for (const [slotStart, slotEnd] of slots) {
                const overlapping = bookings.filter(b =>
                    !cancelledIds.has(b.id) &&
                    b.date === date &&
                    b.slotStart < slotEnd &&
                    b.slotEnd > slotStart,
                );
                if (overlapping.length > next.maxCapacity) {
                    overlapping.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                    overlapping
                        .slice(0, overlapping.length - next.maxCapacity)
                        .forEach(b => cancelledIds.add(b.id));
                }
            }
        }
    }

    return cancelledIds;
}

// Returns true if the two opening hours objects differ in any day's open/close times
function openingHoursChanged(a: OpeningHours, b: OpeningHours): boolean {
    for (const day of Object.keys(a) as Array<keyof OpeningHours>) {
        const ah = a[day], bh = b[day];
        if (ah === null && bh === null) continue;
        if (ah === null || bh === null) return true;
        if (ah.open !== bh.open || ah.close !== bh.close) return true;
    }
    return false;
}

// Builds a comma-separated list of what changed for notification messages
function buildChangedDescription(facility: Facility, newData: FacilityForm): string {
    const parts: string[] = [];
    if (newData.name !== facility.name) parts.push('name');
    if (newData.location !== facility.location) parts.push('location');
    if (newData.description !== facility.description) parts.push('description');
    if (openingHoursChanged(facility.openingHours, newData.openingHours)) parts.push('opening hours');
    if (newData.maxCapacity !== facility.maxCapacity) parts.push('capacity');
    if (newData.slotDurationMins !== facility.slotDurationMins) parts.push('slot duration');
    if (newData.isActive !== facility.isActive) parts.push('status');
    return parts.join(', ');
}

/**
 * Returns the number of bookings that would be cancelled by the proposed facility edit.
 * Used to warn the admin before they confirm the facility change.
 * @param facilityId Facility's ID.
 * @param current Current facility document.
 * @param next Proposed new config from the edit form.
 * @returns Count of upcoming bookings that would be cancelled.
 */
export async function previewCancellationsForFacilityEdit(
    facilityId: string,
    current: Facility,
    next: FacilityForm,
): Promise<number> {
    const bookings = await getUpcomingBookingsForFacility(facilityId);
    return computeCancelledIds(bookings, current, next).size;
}

/**
 * Applies a facility edit: cancels affected bookings, updates the facility document and sends notifications to affected members and assigned staff.
 * @param facility Current facility document.
 * @param newData New config values from the edit form.
 */
export async function applyFacilityEdit(
    facility: Facility,
    newData: FacilityForm,
): Promise<void> {
    const now = new Date().toISOString();

    const [bookings, bookingRequests] = await Promise.all([
        getUpcomingBookingsForFacility(facility.id),
        getBookingRequestsForFacility(facility.id),
    ]);
    const cancelledIds = computeCancelledIds(bookings, facility, newData);

    // Cancel affected bookings and notify their members
    const cancelledMemberIds = new Set<string>();
    await Promise.all(
        bookings
            .filter(b => cancelledIds.has(b.id))
            .map(async (booking) => {
                await updateDoc(doc(db, 'bookings', booking.id), { status: 'cancelled', updatedAt: now });
                await createNotification({
                    userId: booking.memberId,
                    type: 'booking_cancelled',
                    title: 'Booking Cancelled',
                    message: `Your booking at ${facility.name} on ${formatDate(booking.date)} has been cancelled due to ${getCancelReason(booking, facility, newData)}.`,
                    relatedId: booking.id,
                    relatedType: 'booking',
                });
                cancelledMemberIds.add(booking.memberId);
            }),
    );

    // If facility is being deactivated, also cancel all booking requests
    if (!newData.isActive) {
        await cancelBookingRequestsForFacility(facility.id);
    }

    // Update the facility document
    await updateDoc(doc(db, 'facilities', facility.id), {
        ...newData,
        updatedAt: now,
    });

    const changedParts = buildChangedDescription(facility, newData);

    // Compute all potential notification recipient ID sets
    const remainingMemberIds = new Set(
        bookings
            .filter(b => !cancelledIds.has(b.id))
            .map(b => b.memberId)
            .filter(id => !cancelledMemberIds.has(id)),
    );
    const alreadyNotified = new Set([...cancelledMemberIds, ...remainingMemberIds]);
    const requestMemberIds = new Set(
        bookingRequests
            .map(r => r.memberId)
            .filter(id => !alreadyNotified.has(id)),
    );

    // Fetch profiles for all potential recipients so we can filter by role
    const allRecipientIds = [...new Set([...newData.assignedStaffIds, ...remainingMemberIds, ...requestMemberIds])];
    const profiles = await getUsersByIds(allRecipientIds);
    const roleMap = new Map(profiles.map(u => [u.uid, u.role]));

    // Notify assigned staff about the edit (admins excluded)
    await Promise.all(
        newData.assignedStaffIds
            .filter(id => roleMap.get(id) === 'staff')
            .map(staffId =>
                createNotification({
                    userId: staffId,
                    type: 'facility_updated',
                    title: 'Facility Updated',
                    message: `${facility.name} has been updated${changedParts ? ` (${changedParts})` : ''}.`,
                    relatedId: facility.id,
                    relatedType: 'facility',
                }),
            ),
    );

    // Notify members with remaining bookings or booking requests about the edit (admins excluded)
    if (changedParts) {
        await Promise.all([
            ...[...remainingMemberIds]
                .filter(id => roleMap.get(id) === 'member')
                .map(memberId =>
                    createNotification({
                        userId: memberId,
                        type: 'facility_updated',
                        title: 'Facility Updated',
                        message: `${facility.name} has been updated (${changedParts}). Your upcoming booking is not affected.`,
                        relatedId: facility.id,
                        relatedType: 'facility',
                    }),
                ),
            ...[...requestMemberIds]
                .filter(id => roleMap.get(id) === 'member')
                .map(memberId =>
                    createNotification({
                        userId: memberId,
                        type: 'facility_updated',
                        title: 'Facility Updated',
                        message: `${facility.name} has been updated (${changedParts}). Your booking request is not affected.`,
                        relatedId: facility.id,
                        relatedType: 'facility',
                    }),
                ),
        ]);
    }
}
