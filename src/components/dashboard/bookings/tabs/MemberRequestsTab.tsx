'use client';

import { useState } from 'react';
import { CalendarDays, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

import {
    cancelBookingRequest,
    acceptAlternativeSuggestion,
    rejectAlternativeSuggestion,
} from '@/lib/bookingRequests';
import type { BookingRequest } from '@/types/bookingRequest';
import type { Facility } from '@/types/facility';
import { formatDateTime } from '@/lib/utils/date';
import { requestStatuscolour, requestStatusLabel } from '@/lib/utils/status';

import { BookingEmptyState } from '../BookingEmptyState';
import { SortDir, SortHeader, ResizeHandle, makeResizer } from '@/lib/utils/bookingTableHelpers';
import ConfirmSlotModal from '../modals/ConfirmSlotModal';

// Shape of component's props
interface Props {
    requests: BookingRequest[];
    facilityMap: Record<string, Facility>;
    onLoad: () => void;
}

export default function MemberRequestsTab({ requests, facilityMap, onLoad }: Props) {
    const [sortDir, setSortDir] = useState<SortDir>('desc');                                                    // Sort direction for the table
    const [colWidths, setColWidths] = useState({ facility: 176, location: 144, status: 140, created: 160 });    // Column widths in px
    const startResize = makeResizer<typeof colWidths>(setColWidths);                                            // Drag handler for column resizing
    const [expandedId, setExpandedId] = useState<string | null>(null);                                          // Currently expanded row id
    const [cancellingRequest, setCancellingRequest] = useState<string | null>(null);                            // Request id being cancelled
    const [responding, setResponding] = useState<string | null>(null);                                          // Request id being responded to
    const [confirmSlotTarget, setConfirmSlotTarget] = useState<BookingRequest | null>(null);                    // Request for slot confirmation modal

    // Cancel a pending or approved request
    async function handleCancelRequest(req: BookingRequest) {
        setCancellingRequest(req.id);
        await cancelBookingRequest(req.id);
        setCancellingRequest(null);
        onLoad();
    }

    // Accept an alternative facility suggestion
    async function handleAcceptAlternative(req: BookingRequest) {
        setResponding(req.id);
        await acceptAlternativeSuggestion(req.id, req);
        setResponding(null);
        onLoad();
    }

    // Decline an alternative facility suggestion
    async function handleRejectAlternative(req: BookingRequest) {
        setResponding(req.id);
        await rejectAlternativeSuggestion(req.id);
        setResponding(null);
        onLoad();
    }

    // Merge actionable and rejected requests, sorted by last updated
    const actionableRequests = requests.filter(r =>
        ['pending', 'approved', 'alternative_suggested'].includes(r.status),
    );
    const rejectedRequests = requests.filter(r => r.status === 'rejected');
    const visibleRequests = [...actionableRequests, ...rejectedRequests]
        .sort((a, b) => sortDir === 'desc'
            ? b.updatedAt.localeCompare(a.updatedAt)
            : a.updatedAt.localeCompare(b.updatedAt));

    // Empty state - shown when there are no requests to display
    if (visibleRequests.length === 0) {
        return (
            <BookingEmptyState
                icon={<CalendarDays className="w-10 h-10 text-slate-300" />}
                message="No booking requests."
                action={{ label: 'Browse facilities', href: '/facilities' }}
            />
        );
    }

    return (
        <>
            {/* Requests table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {/* Header */}
                    <div className="flex items-stretch px-4 py-2.5 bg-slate-50 border-b border-slate-200 min-w-max">
                        <div className="w-8 shrink-0" />
                        <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.facility }}>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0 truncate">Facility</span>
                            <ResizeHandle onMouseDown={e => startResize('facility', e.clientX, colWidths.facility)} />
                        </div>
                        <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.location }}>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0 truncate">Location</span>
                            <ResizeHandle onMouseDown={e => startResize('location', e.clientX, colWidths.location)} />
                        </div>
                        <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.status }}>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0 truncate">Status</span>
                            <ResizeHandle onMouseDown={e => startResize('status', e.clientX, colWidths.status)} />
                        </div>
                        <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.created }}>
                            <SortHeader
                                label="Updated"
                                dir={sortDir}
                                onToggle={() => setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')}
                            />
                            <ResizeHandle onMouseDown={e => startResize('created', e.clientX, colWidths.created)} />
                        </div>
                        <div className="flex-1 min-w-50">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</span>
                        </div>
                    </div>

                    {/* Rows */}
                    {visibleRequests.map(req => {
                        const isExpanded = expandedId === req.id;   // Whether this row is expanded
                        return (
                            <div key={req.id} className="border-b border-slate-100 last:border-0">
                                <div className="flex items-center px-4 py-4 hover:bg-slate-50/70 transition-colors min-w-max">
                                    <button
                                        className="w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                                    >
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`} />
                                    </button>
                                    <div className="shrink-0 pr-4 min-w-0 overflow-hidden" style={{ width: colWidths.facility }}>
                                        <p className="text-sm font-semibold text-slate-900 truncate">{req.facilityName}</p>
                                    </div>
                                    <div className="shrink-0 pr-4 min-w-0 overflow-hidden" style={{ width: colWidths.location }}>
                                        <p className="text-sm text-slate-600 truncate">{facilityMap[req.facilityId]?.location ?? "—"}</p>
                                    </div>
                                    <div className="shrink-0 pr-4 overflow-hidden flex items-center" style={{ width: colWidths.status }}>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap min-w-0 overflow-hidden ${requestStatuscolour(req.status)}`}>
                                            {requestStatusLabel(req.status)}
                                        </span>
                                    </div>
                                    <div className="shrink-0 pr-4 min-w-0 overflow-hidden" style={{ width: colWidths.created }}>
                                        <p className="text-sm text-slate-600 truncate">{formatDateTime(req.updatedAt)}</p>
                                    </div>
                                    <div className="flex-1 min-w-50 flex items-center gap-1.5">
                                        {req.status === 'approved' && (
                                            <>
                                                <button 
                                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap"
                                                    onClick={() => setConfirmSlotTarget(req)}
                                                >
                                                    <CalendarDays className="w-3.5 h-3.5 shrink-0" /> Select Slot
                                                </button>
                                                <button 
                                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                                                    onClick={() => handleCancelRequest(req)} 
                                                    disabled={cancellingRequest === req.id}
                                                >
                                                    <XCircle className="w-3.5 h-3.5 shrink-0" /> Cancel
                                                </button>
                                            </>
                                        )}
                                        {req.status === 'alternative_suggested' && (
                                            <>
                                                <button 
                                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                                                    onClick={() => handleAcceptAlternative(req)} 
                                                    disabled={responding === req.id}
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Accept
                                                </button>
                                                <button 
                                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                                                    onClick={() => handleRejectAlternative(req)} 
                                                    disabled={responding === req.id}
                                                >
                                                    <XCircle className="w-3.5 h-3.5 shrink-0" /> Decline
                                                </button>
                                            </>
                                        )}
                                        {req.status === 'pending' && (
                                            <button 
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                                                onClick={() => handleCancelRequest(req)} 
                                                disabled={cancellingRequest === req.id}
                                            >
                                                <XCircle className="w-3.5 h-3.5 shrink-0" /> Cancel
                                            </button>
                                        )}
                                        {req.status === 'rejected' && (
                                            <button 
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                                                onClick={() => handleCancelRequest(req)} 
                                                disabled={cancellingRequest === req.id}
                                            >
                                                Discard
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="px-4 pb-4 bg-slate-50/60 space-y-2">
                                        {/* Intended activity */}
                                        <div className="ml-8 border border-sky-200 bg-sky-50 rounded-xl px-3 py-2.5">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Intended Activity</p>
                                            <p className="text-sm text-slate-700 leading-snug">{req.activityDescription}</p>
                                        </div>
                                        {/* Rejection reason */}
                                        {req.status === 'rejected' && req.reviewNote && (
                                            <div className="ml-8 flex items-start gap-2.5 border-l-4 border-red-400 bg-red-50 rounded-r-xl px-3 py-2.5">
                                                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-800"><span className="font-semibold">Reason:</span> {req.reviewNote}</p>
                                            </div>
                                        )}
                                        {/* Alternative suggestion details */}
                                        {req.status === 'alternative_suggested' && (
                                            <div className="ml-8 border-l-4 border-sky-400 bg-sky-50 rounded-r-xl px-3 py-2.5 space-y-1">
                                                <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Alternative Suggested</p>
                                                <p className="text-sm text-sky-800"><span className="font-semibold">Facility:</span> {req.suggestedFacilityName}</p>
                                                {req.reviewNote && (
                                                    <p className="text-sm text-sky-800"><span className="font-semibold">Reason:</span> {req.reviewNote}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Slot confirmation modal */}
            {confirmSlotTarget && (
                <ConfirmSlotModal
                    request={confirmSlotTarget}
                    onClose={() => setConfirmSlotTarget(null)}
                    onDone={() => { setConfirmSlotTarget(null); onLoad(); }}
                />
            )}
        </>
    );
}
