import type { BookingStatus } from "@/types/booking";
import type { BookingRequestStatus } from "@/types/bookingRequest";
import type { ReportStatus } from "@/types/equipmentReport";

const REQUEST_STATUS_LABELS: Record<BookingRequestStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Declined',
    alternative_suggested: 'Alternative Suggested',
};

const REQUEST_STATUS_COLOURS: Record<BookingRequestStatus, string> = {
    pending: 'bg-amber-500 text-white',
    approved: 'bg-emerald-500 text-white',
    rejected: 'bg-red-500 text-white',
    alternative_suggested: 'bg-violet-500 text-white',
};

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
    upcoming: 'Upcoming',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

const BOOKING_STATUS_COLOURS: Record<BookingStatus, string> = {
    upcoming: 'bg-sky-500 text-white',
    cancelled: 'bg-red-500 text-white',
    completed: 'bg-slate-400 text-white',
};

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
    pending: 'Pending',
    noted: 'Noted',
    repair_in_progress: 'Repair In Progress',
    resolved: 'Resolved',
};

const REPORT_STATUS_COLOURS: Record<ReportStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    noted: 'bg-purple-100 text-purple-700',
    repair_in_progress: 'bg-orange-100 text-orange-700',
    resolved: 'bg-green-100 text-green-700',   
};

/**
 * Maps a booking request's status to a label.
 * @param status Booking request's status.
 * @returns Label.
 */
export function requestStatusLabel(status: BookingRequestStatus): string {
    return REQUEST_STATUS_LABELS[status];
}

/**
 * Maps a booking request's status to a colour.
 * @param status Booking request's status.
 * @returns Tailwind CSS colour class.
 */
export function requestStatuscolour(status: BookingRequestStatus): string {
    return REQUEST_STATUS_COLOURS[status];
}

/**
 * Maps a booking's status to a label.
 * @param status Booking's status.
 * @returns Label.
 */
export function bookingStatusLabel(status: BookingStatus): string {
    return BOOKING_STATUS_LABELS[status];
}

/**
 * Maps a booking's status to a colour.
 * @param status Booking's status.
 * @returns Tailwind CSS colour class.
 */
export function bookingStatusColour(status: BookingStatus): string {
    return BOOKING_STATUS_COLOURS[status];
}

/**
 * Maps a fault equipment report's status to a label. 
 * @param status Fault equipment report's status.
 * @returns Label.
 */
export function reportStatusLabel(status: ReportStatus): string {
    return REPORT_STATUS_LABELS[status];
}

/**
 * Maps a fault equipment report's status to a colour. 
 * @param status Fault equipment report's status.
 * @returns Tailwind CSS colour class.
 */
export function reportStatusColour(status: ReportStatus): string {
    return REPORT_STATUS_COLOURS[status];
}
