export type BookingRequestStatus = 'pending' | 'approved' | 'rejected' | 'alternative_suggested';

export interface BookingRequest {
    id: string;
    memberId: string;
    memberName: string;
    memberEmail: string;
    facilityId: string;
    facilityName: string;
    activityDescription: string;
    status: BookingRequestStatus;
    reviewedBy?: string;
    reviewNote?: string;
    suggestedFacilityId?: string;
    suggestedFacilityName?: string;
    createdAt: string;  // ISO datetime string (YYYY-MM-DDTHH:mm:ssZ)
    updatedAt: string;  // ISO datetime string (YYYY-MM-DDTHH:mm:ssZ)
}

export const ACTIVE_REQUEST_STATUSES = ['pending', 'approved', 'alternative_suggested'] as const;

export type ActiveRequestStatus = typeof ACTIVE_REQUEST_STATUSES[number];

export const ACTIVE_STATUS_UI: Record<ActiveRequestStatus, { beforeText: string; linkText: string; afterText: string }> = {
    pending: { beforeText: "Your ", linkText: "request", afterText: " is awaiting staff review. You'll be notified once it has been reviewed." },
    approved: { beforeText: "Your request was approved. Select a time slot in ", linkText: "Bookings", afterText: " to confirm your booking." },
    alternative_suggested: { beforeText: "Staff has suggested an alternative facility. Respond in ", linkText: "Bookings", afterText: "." },
};
