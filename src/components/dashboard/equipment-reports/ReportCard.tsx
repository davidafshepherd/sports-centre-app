import { ChevronDown } from "lucide-react"
import { reportStatusColour, reportStatusLabel } from "@/lib/utils/status"
import { formatDate, formatDateTime } from "@/lib/utils/date"
import type { EquipmentReport } from "@/types/equipmentReport"

interface Props {
    report: EquipmentReport
    // staff and admin can update status but members can only view
    canUpdate: boolean
    onUpdate: (report: EquipmentReport) => void
}

export default function ReportCard({ report, canUpdate, onUpdate }: Props) {

    const hasBeenUpdated = report.status !== "pending"

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            {/* header with equipment name, facility, status badge */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-semibold text-slate-900">{report.equipmentName}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {report.facilityName} · Reported {formatDate(report.createdAt.split("T")[0])}
                    </p>
                    {canUpdate && (
                        <p className="text-xs text-slate-400 mt-0.5">
                            Reported by {report.reporterName}
                        </p>
                    )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${reportStatusColour(report.status)}`}>
                    {reportStatusLabel(report.status)}
                </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">{report.description}</p>

            {/* staff note is shown to staff and members if present */}
            {report.staffNote && (
                <div className="pl-3 border-l-2 border-slate-200">
                    <p className="text-xs font-medium text-slate-400 mb-0.5">Staff note</p>
                    <p className="text-sm text-slate-500 italic">{report.staffNote}</p>
                </div>
            )}

            {/* footer with last updated timestamp + update button for staff */}
            <div className="flex items-center justify-between pt-1">
                {hasBeenUpdated && (
                    <p className="text-xs text-slate-400">
                        Last updated {formatDateTime(report.updatedAt)}
                    </p>
                )}
                {canUpdate && (
                    <button
                        onClick={() => onUpdate(report)}
                        className="ml-auto flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                        Update Status
                    </button>
                )}
            </div>
        </div>
    )
}