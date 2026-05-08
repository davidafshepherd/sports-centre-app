"use client"

import { useEffect, useState, useCallback } from "react"
import { Wrench, Plus } from "lucide-react"
import { useAuth } from "@/providers/AuthProvider"
import { getEquipmentReportsByMember, getEquipmentReportsForStaff } from "@/lib/equipmentReports"
import { getFacilities } from "@/lib/facilities"
import { reportStatusLabel } from "@/lib/utils/status"
import type { EquipmentReport, ReportStatus } from "@/types/equipmentReport"
import type { Facility } from "@/types/facility"
import ReportCard from "./ReportCard"
import ReportFormModal from "./ReportFormModal"
import UpdateStatusModal from "./UpdateStatusModal"

// status_filter const is to filter by different report types
const STATUS_FILTERS: { label: string; value: ReportStatus | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Noted", value: "noted" },
    { label: "In Progress", value: "repair_in_progress" },
    { label: "Resolved", value: "resolved" },
]

export default function EquipmentReportsView() {
    const { user, userProfile } = useAuth()
    const role = userProfile?.role

    const [reports, setReports] = useState<EquipmentReport[]>([])
    const [facilities, setFacilities] = useState<Facility[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all")

    // state for the modals to make sure only one can be open at a time
    const [showReportForm, setShowReportForm] = useState(false)
    const [updateTarget, setUpdateTarget] = useState<EquipmentReport | null>(null)

    // fetch reports based on the current user role: members see their own reports, staff see reports for their facilities
    const load = useCallback(async () => {
        if (!user || !role) return

        setLoading(true)

        const [fetchedReports, fetchedFacilities] = await Promise.all([
            role === "member"
                ? getEquipmentReportsByMember(user.uid)
                : getEquipmentReportsForStaff(user.uid),

            // only members need the facility list used for the dropdown
            role === "member" ? getFacilities() : Promise.resolve([] as Facility[]),
        ])

        setReports(fetchedReports)
        setFacilities(fetchedFacilities)
        setLoading(false)
    }, [user, role])

    useEffect(() => { load() }, [load])

    // apply status filter client-side since all reports were already fetched
    const visibleReports = statusFilter === "all"
        ? reports
        : reports.filter(report => report.status === statusFilter)

    // staff can update report statuses, members can only view
    const canUpdate = role === "staff"


    const emptyMessage = role === "member"
        ? "You haven't reported any equipment issues yet."
        : "No equipment reports for your assigned facilities."

    if (loading) return (
        <div className="max-w-2xl space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200 rounded-xl" />
            ))}
        </div>
    )

    return (
        <div className="max-w-2xl space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Equipment Reports</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {role === "member"
                            ? "Report faulty or damaged equipment to sports centre staff."
                            : "Review and update the status of equipment issues reported by members."}
                    </p>
                </div>

                {/* members can open the report form from the header */}
                {role === "member" && (
                    <button
                        onClick={() => setShowReportForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors shrink-0">
                        <Plus className="w-4 h-4" />
                        Report Issue
                    </button>
                )}
            </div>

            {/* status filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
                {STATUS_FILTERS.map(filter => (
                        <button
                        key={filter.value}
                        onClick={() => setStatusFilter(filter.value)}
                        className={["px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", statusFilter === filter.value? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50", ].join(" ")}>
                        {filter.label}
                        {/* show count per status */}
                        {filter.value !== "all" && (
                            <span className="ml-1.5 opacity-60">
                                {reports.filter(report => report.status === filter.value).length}
                            </span>
                        )}
                    </button>
             ))}
            </div>

        {/* empty state */}
            {visibleReports.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <Wrench className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-700">
                        {statusFilter !== "all"
                            ? `No ${reportStatusLabel(statusFilter as ReportStatus).toLowerCase()} reports.`
                            : "No reports yet."}
                    </p>
                    <p className="text-sm mt-1">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleReports.map(report => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            canUpdate={canUpdate}
                            onUpdate={setUpdateTarget}
                        />
                    ))}
                </div>
            )}

            {/* report form modal for members */}
            {showReportForm && userProfile && (
                <ReportFormModal
                    facilities={facilities}
                    memberId={user?.uid ?? ""}
                    memberName={`${userProfile.firstName} ${userProfile.lastName}`}
                    onClose={() => setShowReportForm(false)}
                    onSubmitted={() => { setShowReportForm(false); load() }}
                />
            )}

            {/* status update modal for staff */}
            {updateTarget && user && (
                <UpdateStatusModal
                    report={updateTarget}
                    staffUid={user.uid}
                    onClose={() => setUpdateTarget(null)}
                    onUpdated={() => { setUpdateTarget(null); load() }}
                />
            )}
        </div>
    )
}