export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Booking {
    id: string;
    memberId: string;
    memberName: string;
    memberEmail: string;
    facilityId: string;
    facilityName: string;
    activityDescription: string;
    status: BookingStatus;
    date: string;
    slotStart: number;  // minutes from midnight (e.g. 8:00 AM = 480)
    slotEnd: number;    // slotStart + slotDurationMins
    completedBy?: string;
    createdAt: string;  // ISO datetime string (YYYY-MM-DDTHH:mm:ssZ)
    updatedAt: string;  // ISO datetime string (YYYY-MM-DDTHH:mm:ssZ)
}
