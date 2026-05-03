import { db } from "@/lib/firebase"
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"
import type { BookingRequest, Booking } from "@/types/booking"
import { createNotification } from "@/lib/notifications"
import { getFacilitiesForStaff, getFacilityById } from "@/lib/facilities"
import { formatDate, formatSlot } from "@/lib/utils"

// ── Booking requests ───────────────────────────────────────────────────────

export async function createBookingRequest(data: {
    memberId: string
    memberName: string
    facilityId: string
    facilityName: string
    activityDescription: string
}): Promise<string> {
    const now = new Date().toISOString()
    const ref = await addDoc(collection(db, "bookingRequests"), {
        ...data,
        status: "pending",
        createdAt: now,
        updatedAt: now,
    })
    const facility = await getFacilityById(data.facilityId)
    if (facility && facility.assignedStaffIds.length > 0) {
        await Promise.all(facility.assignedStaffIds.map(staffId =>
            createNotification({
                userId: staffId,
                type: "booking_request_received",
                title: "New Booking Request",
                message: `${data.memberName} has submitted a booking request for ${data.facilityName}.`,
                relatedId: ref.id,
                relatedType: "bookingRequest",
            }),
        ))
    }
    return ref.id
}

export async function getBookingRequestsForMember(memberId: string): Promise<BookingRequest[]> {
    const q = query(collection(db, "bookingRequests"), where("memberId", "==", memberId))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as BookingRequest))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getBookingRequestsForStaff(staffUid: string): Promise<BookingRequest[]> {
    const facilities = await getFacilitiesForStaff(staffUid)
    if (facilities.length === 0) return []
    const facilityIds = facilities.map(f => f.id)
    const q = query(collection(db, "bookingRequests"), where("facilityId", "in", facilityIds))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as BookingRequest))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getAllBookingRequests(): Promise<BookingRequest[]> {
    const snap = await getDocs(collection(db, "bookingRequests"))
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as BookingRequest))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function approveBookingRequest(
    requestId: string,
    request: BookingRequest,
    staffUid: string,
): Promise<void> {
    const now = new Date().toISOString()
    await updateDoc(doc(db, "bookingRequests", requestId), {
        status: "approved",
        reviewedBy: staffUid,
        updatedAt: now,
    })
    await createNotification({
        userId: request.memberId,
        type: "booking_approved",
        title: "Request Approved",
        message: `Your booking request for ${request.facilityName} has been approved. Please select a time slot to confirm your booking.`,
        relatedId: requestId,
        relatedType: "bookingRequest",
    })
}

export async function rejectBookingRequest(
    requestId: string,
    request: BookingRequest,
    staffUid: string,
    note: string,
): Promise<void> {
    const now = new Date().toISOString()
    await updateDoc(doc(db, "bookingRequests", requestId), {
        status: "rejected",
        reviewedBy: staffUid,
        reviewNote: note,
        updatedAt: now,
    })
    await createNotification({
        userId: request.memberId,
        type: "booking_rejected",
        title: "Booking Declined",
        message: `Your booking request for ${request.facilityName} was declined.${note ? ` Reason: ${note}` : ""}`,
        relatedId: requestId,
        relatedType: "bookingRequest",
    })
}

export async function confirmBookingSlot(
    requestId: string,
    request: BookingRequest,
    memberUid: string,
    date: string,
    slotStart: number,
    slotDurationMins: number,
): Promise<void> {
    const now = new Date().toISOString()
    const bookingRef = await addDoc(collection(db, "bookings"), {
        memberId: request.memberId,
        memberName: request.memberName,
        facilityId: request.facilityId,
        facilityName: request.facilityName,
        date,
        slotStart,
        slotEnd: slotStart + slotDurationMins,
        activityDescription: request.activityDescription,
        status: "upcoming",
        confirmedBy: memberUid,
        createdAt: now,
        updatedAt: now,
    })
    await deleteDoc(doc(db, "bookingRequests", requestId))
    const facility = await getFacilityById(request.facilityId)
    if (facility && facility.assignedStaffIds.length > 0) {
        await Promise.all(facility.assignedStaffIds.map(staffId =>
            createNotification({
                userId: staffId,
                type: "booking_confirmed_staff",
                title: "Booking Confirmed",
                message: `${request.memberName} has confirmed a booking at ${request.facilityName} on ${formatDate(date)} at ${formatSlot(slotStart)}.`,
                relatedId: bookingRef.id,
                relatedType: "booking",
            }),
        ))
    }
}

export async function suggestAlternative(
    requestId: string,
    request: BookingRequest,
    staffUid: string,
    suggestion: {
        facilityId: string
        facilityName: string
        note: string
    },
): Promise<void> {
    const now = new Date().toISOString()
    await updateDoc(doc(db, "bookingRequests", requestId), {
        status: "alternative_suggested",
        reviewedBy: staffUid,
        reviewNote: suggestion.note,
        suggestedFacilityId: suggestion.facilityId,
        suggestedFacilityName: suggestion.facilityName,
        updatedAt: now,
    })
    await createNotification({
        userId: request.memberId,
        type: "booking_alternative",
        title: "Alternative Facility Suggested",
        message: `Staff suggested an alternative facility: ${suggestion.facilityName}. Accept or decline in your bookings.`,
        relatedId: requestId,
        relatedType: "bookingRequest",
    })
}

export async function acceptAlternativeSuggestion(
    requestId: string,
    request: BookingRequest,
): Promise<void> {
    const facilityId = request.suggestedFacilityId ?? request.facilityId
    const facilityName = request.suggestedFacilityName ?? request.facilityName
    await updateDoc(doc(db, "bookingRequests", requestId), {
        status: "approved",
        facilityId,
        facilityName,
        updatedAt: new Date().toISOString(),
    })
}

export async function rejectAlternativeSuggestion(requestId: string): Promise<void> {
    await deleteDoc(doc(db, "bookingRequests", requestId))
}

export async function cancelBookingRequest(requestId: string): Promise<void> {
    await deleteDoc(doc(db, "bookingRequests", requestId))
}

// ── Bookings ───────────────────────────────────────────────────────────────

export async function getBookingsForMember(memberId: string): Promise<Booking[]> {
    const q = query(collection(db, "bookings"), where("memberId", "==", memberId))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Booking))
        .sort((a, b) => b.date.localeCompare(a.date) || b.slotStart - a.slotStart)
}

export async function getUpcomingBookingsForFacility(facilityId: string): Promise<Booking[]> {
    const q = query(collection(db, "bookings"), where("facilityId", "==", facilityId))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Booking))
        .filter(b => b.status === "upcoming")
}

export async function getBookingsForFacility(facilityId: string, date: string): Promise<Booking[]> {
    const q = query(collection(db, "bookings"), where("facilityId", "==", facilityId))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Booking))
        .filter(b => b.date === date && b.status === "upcoming")
}

export async function getBookingsForStaff(staffUid: string): Promise<Booking[]> {
    const facilities = await getFacilitiesForStaff(staffUid)
    if (facilities.length === 0) return []
    const facilityIds = facilities.map(f => f.id)
    const q = query(collection(db, "bookings"), where("facilityId", "in", facilityIds))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Booking))
        .sort((a, b) => b.date.localeCompare(a.date))
}

export async function cancelBooking(
    bookingId: string,
    booking: Booking,
    cancelledBy: "member" | "staff",
): Promise<void> {
    const now = new Date().toISOString()
    await updateDoc(doc(db, "bookings", bookingId), {
        status: "cancelled",
        cancelledBy,
        cancelledAt: now,
        updatedAt: now,
    })
    if (cancelledBy === "staff") {
        await createNotification({
            userId: booking.memberId,
            type: "booking_cancelled",
            title: "Booking Cancelled",
            message: `Your booking for ${booking.facilityName} on ${formatDate(booking.date)} at ${formatSlot(booking.slotStart)} has been cancelled by staff.`,
            relatedId: bookingId,
            relatedType: "booking",
        })
    }
}

export async function markBookingComplete(
    bookingId: string,
    booking: Booking,
    staffUid: string,
): Promise<void> {
    const now = new Date().toISOString()
    await updateDoc(doc(db, "bookings", bookingId), {
        status: "completed",
        completedBy: staffUid,
        completedAt: now,
        updatedAt: now,
    })
    await createNotification({
        userId: booking.memberId,
        type: "booking_completed",
        title: "Session Completed",
        message: `Your session at ${booking.facilityName} on ${formatDate(booking.date)} has been marked as completed.`,
        relatedId: bookingId,
        relatedType: "booking",
    })
}
