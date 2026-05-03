export type NotificationType =
    | "booking_approved"
    | "booking_rejected"
    | "booking_alternative"
    | "booking_completed"
    | "booking_cancelled"
    | "booking_request_received"
    | "booking_confirmed_staff"
    | "partner_request"
    | "partner_accepted"
    | "partner_rejected"
    | "equipment_report_updated"

export interface AppNotification {
    id: string
    userId: string
    type: NotificationType
    title: string
    message: string
    read: boolean
    relatedId?: string
    relatedType?: "booking" | "bookingRequest" | "partnerRequest" | "equipmentReport"
    createdAt: string
}
