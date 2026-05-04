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
