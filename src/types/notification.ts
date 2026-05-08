import {
    Bell,
    Building2,
    CalendarDays,
    UserCheck,
    UserX,
    Wrench,
    type LucideIcon,
} from 'lucide-react';

export type NotificationType =
    | 'booking_approved'
    | 'booking_rejected'
    | 'booking_alternative'
    | 'booking_completed'
    | 'booking_cancelled'
    | 'booking_request_received'
    | 'booking_confirmed_staff'
    | 'partner_request'
    | 'partner_accepted'
    | 'partner_rejected'
    | 'equipment_report_updated'
    | 'facility_updated';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    relatedId?: string;
    relatedType?: 'booking' | 'bookingRequest' | 'partnerRequest' | 'equipmentReport' | 'facility';
    createdAt: string;
}

export const NOTIFICATION_ICON: Record<NotificationType, LucideIcon> = {
    booking_approved: CalendarDays,
    booking_rejected: CalendarDays,
    booking_alternative: CalendarDays,
    booking_completed: CalendarDays,
    booking_cancelled: CalendarDays,
    booking_request_received: CalendarDays,
    booking_confirmed_staff: CalendarDays,
    partner_request: UserCheck,
    partner_accepted: UserCheck,
    partner_rejected: UserX,
    equipment_report_updated: Wrench,
    facility_updated: Building2,
};

export const NOTIFICATION_COLOUR: Record<NotificationType, string> = {
    booking_approved: 'bg-green-100 text-green-600',
    booking_rejected: 'bg-red-100 text-red-600',
    booking_alternative: 'bg-blue-100 text-blue-600',
    booking_completed: 'bg-slate-100 text-slate-500',
    booking_cancelled: 'bg-red-100 text-red-600',
    booking_request_received: 'bg-amber-100 text-amber-600',
    booking_confirmed_staff: 'bg-sky-100 text-sky-600',
    partner_request: 'bg-sky-100 text-sky-600',
    partner_accepted: 'bg-green-100 text-green-600',
    partner_rejected: 'bg-red-100 text-red-600',
    equipment_report_updated: 'bg-orange-100 text-orange-600',
    facility_updated: 'bg-sky-100 text-sky-600',
};

// Fallback icon and colour for unknown notification types
export const NOTIFICATION_ICON_FALLBACK: LucideIcon = Bell;
export const NOTIFICATION_COLOUR_FALLBACK = 'bg-slate-100 text-slate-500';
