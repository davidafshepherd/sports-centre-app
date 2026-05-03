export type ReportStatus = "pending" | "noted" | "repair_in_progress" | "resolved"

export interface EquipmentReport {
    id: string
    reportedBy: string
    reporterName: string
    facilityId: string
    facilityName: string
    equipmentName: string
    description: string
    status: ReportStatus
    staffNote: string
    updatedBy?: string
    createdAt: string
    updatedAt: string
}
