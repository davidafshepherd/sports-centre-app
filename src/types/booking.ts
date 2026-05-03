export type BookingRequestStatus =
    | "pending"
    | "approved"
    | "confirmed"
    | "rejected"
    | "cancelled"
    | "alternative_suggested"
    | "alternative_accepted"
    | "alternative_rejected"

export type BookingStatus = "upcoming" | "completed" | "cancelled"

export interface BookingRequest {
    id: string
    memberId: string
    memberName: string
    facilityId: string
    facilityName: string
    activityDescription: string
    date?: string          // YYYY-MM-DD — only set after slot is confirmed
    slotStart?: number     // minutes from midnight (e.g. 480 = 8:00 AM) — only set after slot is confirmed
    status: BookingRequestStatus
    reviewedBy?: string
    reviewNote?: string
    suggestedFacilityId?: string
    suggestedFacilityName?: string
    createdAt: string
    updatedAt: string
}

export interface Booking {
    id: string
    memberId: string
    memberName: string
    facilityId: string
    facilityName: string
    date: string
    slotStart: number   // minutes from midnight (e.g. 480 = 8:00 AM)
    slotEnd: number     // slotStart + slotDurationMins
    activityDescription: string
    status: BookingStatus
    requestId: string
    confirmedBy: string
    completedBy?: string
    completedAt?: string
    cancelledBy?: "member" | "staff"
    cancelledAt?: string
    createdAt: string
    updatedAt: string
}
