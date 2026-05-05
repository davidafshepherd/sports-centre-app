'use client';

import { useState } from 'react';
import { CheckCircle, CheckCircle2, XCircle, ChevronDown, Repeat } from 'lucide-react';

import { approveBookingRequest, rejectBookingRequest } from '@/lib/bookingRequests';
import { useAuth } from '@/providers/AuthProvider';
import type { BookingRequest } from '@/types/bookingRequest';
import type { Facility } from '@/types/facility';
import { formatDateTime } from '@/lib/utils/date';
import { availabilityCategory } from '@/lib/utils/slots';

import { BookingEmptyState } from '../BookingEmptyState';
import { SortDir, SortHeader, ResizeHandle, makeResizer } from '@/lib/utils/bookingTableHelpers';
import BookingFilterBar from '../BookingFilterBar';
import MemberAvatar from '../MemberAvatar';
import RejectModal from '../modals/RejectModal';
import AlternativeSuggestionModal from '../modals/AlternativeSuggestionModal';

// Shape of component's props
interface Props {
    requests: BookingRequest[];
    allFacilities: Facility[];
    facilityMap: Record<string, Facility>;
    facilityAvailability: Record<string, { booked: number; total: number }>;
    onLoad: () => void;
}

export default function StaffPendingTab({ requests, allFacilities, facilityMap, facilityAvailability, onLoad }: Props) {
    const { user } = useAuth();
    const [sortDir, setSortDir] = useState<SortDir>('desc');                                                                    // Sort direction for the table
    const [filterFacility, setFilterFacility] = useState('');                                                                   // Active facility filter
    const [filterMember, setFilterMember] = useState('');                                                                       // Active member search filter
    const [colWidths, setColWidths] = useState({ facility: 176, location: 144, availability: 132, created: 148, member: 176});  // Column widths in px
    const startResize = makeResizer<typeof colWidths>(setColWidths);                                                            // Drag handler for column resizing
    const [expandedId, setExpandedId] = useState<string | null>(null);                                                          // Currently expanded row id
    const [processing, setProcessing] = useState<string | null>(null);                                                          // Request id being processed
    const [rejectTarget, setRejectTarget] = useState<BookingRequest | null>(null);                                              // Request staged for rejection
    const [altTarget, setAltTarget] = useState<BookingRequest | null>(null);                                                    // Request staged for alternative suggestion

    // Approve a booking request
    async function handleApprove(req: BookingRequest) {
        if (!user) return;
        setProcessing(req.id);
        await approveBookingRequest(req.id, req, user.uid);
        setProcessing(null);
        onLoad();
    }

    // Unique facility names from the current requests, for the filter dropdown
    const facilityOptions = [...new Set(requests.map(r => r.facilityName))].sort();

    // Filter and sort the requests
    const filteredRequests = requests
        .filter(r => filterFacility === '' || r.facilityName === filterFacility)
        .filter(r => (r.memberEmail ?? '').toLowerCase().includes(filterMember.toLowerCase()))
        .sort((a, b) => sortDir === 'desc'
            ? b.createdAt.localeCompare(a.createdAt)
            : a.createdAt.localeCompare(b.createdAt));

    return (
        <>
            {/* Filter bar */}
            <BookingFilterBar
                selects={[{
                    value: filterFacility,
                    onChange: setFilterFacility,
                    placeholder: 'All facilities',
                    options: facilityOptions.map(name => ({ value: name, label: name })),
                }]}
                search={{
                    value: filterMember,
                    onChange: setFilterMember,
                    placeholder: 'Filter by member…',
                }}
                hasFilters={filterFacility !== '' || filterMember !== ''}
                onClear={() => { setFilterFacility(''); setFilterMember(''); }}
            />

            {/* Empty state - shown when the filtered request list is empty */}
            {filteredRequests.length === 0 ? (
                <BookingEmptyState
                    icon={<CheckCircle2 className="w-10 h-10 text-slate-300" />}
                    message={filterFacility !== '' || filterMember !== '' ? 'No requests match your filters.' : 'No pending requests.'}
                />
            ) : (
                // Requests table
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
                            <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.availability }}>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0 truncate">Availability</span>
                                <ResizeHandle onMouseDown={e => startResize('availability', e.clientX, colWidths.availability)} />
                            </div>
                            <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.created }}>
                                <SortHeader
                                    label="Created"
                                    dir={sortDir}
                                    onToggle={() => setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')}
                                />
                                <ResizeHandle onMouseDown={e => startResize('created', e.clientX, colWidths.created)} />
                            </div>
                            <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.member }}>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0 truncate">Requested By</span>
                                <ResizeHandle onMouseDown={e => startResize('member', e.clientX, colWidths.member)} />
                            </div>
                            <div className="flex-1 min-w-50">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</span>
                            </div>
                        </div>

                        {/* Rows */}
                        {filteredRequests.map(req => {
                            const category = facilityMap[req.facilityId]?.category;                                                                                 // Category of the requested facility
                            const avail = facilityAvailability[req.facilityId];                                                                                     // Availability stats for the requested facility
                            const { label: availLabel, colour: availColour } = avail ? availabilityCategory(avail.booked, avail.total) : { label: '', colour: '' }; // Availability label and colour for display
                            const hasAlternatives = allFacilities.some(f => f.category === category && f.isActive && f.id !== req.facilityId);                      // Whether any active alternative facilities exist in the same category
                            const isExpanded = expandedId === req.id;                                                                                               // Whether this row is expanded
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
                                        <div className="shrink-0 pr-4 overflow-hidden flex items-center" style={{ width: colWidths.availability }}>
                                            {avail ? <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap min-w-0 overflow-hidden ${availColour}`}>{availLabel} availability</span> : <span className="text-xs text-slate-400">—</span>}
                                        </div>
                                        <div className="shrink-0 pr-4 min-w-0 overflow-hidden" style={{ width: colWidths.created }}>
                                            <p className="text-sm text-slate-600 truncate">{formatDateTime(req.createdAt)}</p>
                                        </div>
                                        <div className="shrink-0 pr-4 flex items-center gap-2 min-w-0 overflow-hidden" style={{ width: colWidths.member }}>
                                            <MemberAvatar name={req.memberName} />
                                            <p className="text-sm text-slate-700 truncate">{req.memberEmail ?? req.memberName}</p>
                                        </div>
                                        <div className="flex-1 min-w-50 flex items-center gap-1.5">
                                            <button 
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                                                onClick={() => handleApprove(req)} 
                                                disabled={processing === req.id}
                                            >
                                                <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Approve
                                            </button>
                                            <button 
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
                                                onClick={() => setRejectTarget(req)}
                                            >
                                                <XCircle className="w-3.5 h-3.5 shrink-0" /> Decline
                                            </button>
                                            <button 
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-medium hover:enabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                                                onClick={() => setAltTarget(req)}
                                                disabled={!hasAlternatives}
                                                title={!hasAlternatives ? "No alternative facilities available" : undefined}
                                            >
                                                <Repeat className="w-3.5 h-3.5 shrink-0" /> Suggest Alt
                                            </button>
                                        </div>
                                    </div>
                                    {/* Intended activity */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 bg-slate-50/60">
                                            <div className="ml-8 border border-sky-200 bg-sky-50 rounded-xl px-3 py-2.5">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Intended Activity</p>
                                                <p className="text-sm text-slate-700 leading-snug">{req.activityDescription}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Rejection modal */}
            {rejectTarget && (
                <RejectModal
                    title={`Decline request from ${rejectTarget.memberName}`}
                    placeholder="Reason for declining (optional)…"
                    onClose={() => setRejectTarget(null)}
                    onConfirm={async (note) => {
                        if (!user) return;
                        await rejectBookingRequest(rejectTarget.id, rejectTarget, user.uid, note);
                        setRejectTarget(null);
                        onLoad();
                    }}
                />
            )}

            {/* Alternative suggestion modal */}
            {altTarget && (
                <AlternativeSuggestionModal
                    request={altTarget}
                    facilities={allFacilities}
                    onClose={() => setAltTarget(null)}
                    onDone={() => { setAltTarget(null); onLoad(); }}
                />
            )}
        </>
    );
}
