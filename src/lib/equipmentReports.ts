import { db } from "@/lib/firebase"
import { collection, doc, getDocs, addDoc, updateDoc, query, where } from "firebase/firestore"
import type { EquipmentReport, ReportStatus } from "@/types/equipmentReport"
import { getFacilitiesForStaff } from "@/lib/facilities"
import { createNotification } from "@/lib/notifications"
import { reportStatusLabel } from "@/lib/utils/status"

export async function createEquipmentReport(data: {
    reportedBy: string
    reporterName: string
    facilityId: string
    facilityName: string
    equipmentName: string
    description: string
}): Promise<void> {
    const now = new Date().toISOString()
    await addDoc(collection(db, "equipmentReports"), {
        ...data,
        status: "pending",
        staffNote: "",
        createdAt: now,
        updatedAt: now,
    })
}

export async function getEquipmentReportsByMember(memberId: string): Promise<EquipmentReport[]> {
    const q = query(collection(db, "equipmentReports"), where("reportedBy", "==", memberId))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as EquipmentReport))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getEquipmentReportsForStaff(staffUid: string): Promise<EquipmentReport[]> {
    const facilities = await getFacilitiesForStaff(staffUid)
    if (facilities.length === 0) return []
    const facilityIds = facilities.map(f => f.id)
    const q = query(collection(db, "equipmentReports"), where("facilityId", "in", facilityIds))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as EquipmentReport))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getAllEquipmentReports(): Promise<EquipmentReport[]> {
    const snap = await getDocs(collection(db, "equipmentReports"))
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as EquipmentReport))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function updateEquipmentReportStatus(
    reportId: string,
    report: EquipmentReport,
    status: ReportStatus,
    staffUid: string,
    staffNote: string,
): Promise<void> {
    const now = new Date().toISOString()
    await updateDoc(doc(db, "equipmentReports", reportId), {
        status,
        staffNote,
        updatedBy: staffUid,
        updatedAt: now,
    })
    await createNotification({
        userId: report.reportedBy,
        type: "equipment_report_updated",
        title: "Equipment Report Updated",
        message: `Your report for "${report.equipmentName}" at ${report.facilityName} has been updated to: ${reportStatusLabel(status)}.`,
        relatedId: reportId,
        relatedType: "equipmentReport",
    })
}
