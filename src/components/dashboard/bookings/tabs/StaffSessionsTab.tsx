'use client';

import { useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown } from 'lucide-react';

import { markBookingComplete } from '@/lib/bookings';
import { useAuth } from '@/providers/AuthProvider';
import type { Booking } from '@/types/booking';
import type { Facility } from '@/types/facility';
import { formatDate, formatSlot } from '@/lib/utils/date';

import { BookingEmptyState } from '../BookingEmptyState';
import { SortDir, SortHeader, ResizeHandle, makeResizer } from '@/lib/utils/bookingTableHelpers';
import BookingFilterBar from '../BookingFilterBar';
import MemberAvatar from '../MemberAvatar';

// Shape of component's props
interface Props {
    bookings: Booking[];
    assignedFacilities: Facility[];
    facilityMap: Record<string, Facility>;
    onLoad: () => void;
}

export default function StaffSessionsTab({ bookings, assignedFacilities, facilityMap, onLoad }: Props) {
    const { user } = useAuth();
    const [sortDir, setSortDir] = useState<SortDir>('asc');                                                             // Sort direction for the table
    const [filterFacility, setFilterFacility] = useState('');                                                           // Active facility filter
    const [filterMember, setFilterMember] = useState('');                                                               // Active member search filter
    const [colWidths, setColWidths] = useState({ facility: 176, location: 144, date: 112, time: 148, member: 176 });    // Column widths in px
    const startResize = makeResizer<typeof colWidths>(setColWidths);                                                    // Drag handler for column resizing
    const [expandedId, setExpandedId] = useState<string | null>(null);                                                  // Currently expanded row id
    const [processing, setProcessing] = useState<string | null>(null);                                                  // Booking id being processed

    // Mark a session as complete
    async function handleMarkComplete(booking: Booking) {
        if (!user) return;
        setProcessing(booking.id);
        await markBookingComplete(booking.id, booking, user.uid);
        setProcessing(null);
        onLoad();
    }

    // Names of facilities assigned to the staff member
    const facilityOptions = assignedFacilities.map(f => f.name).sort();

    // Filter and sort the bookings
    const filteredBookings = bookings
        .filter(b => filterFacility === '' || b.facilityName === filterFacility)
        .filter(b => (b.memberEmail ?? '').toLowerCase().includes(filterMember.toLowerCase()))
        .sort((a, b) => {
            const ka = a.date + String(a.slotStart).padStart(5, '0');
            const kb = b.date + String(b.slotStart).padStart(5, '0');
            return sortDir === 'asc' ? ka.localeCompare(kb) : kb.localeCompare(ka);
        });

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

            {/* Empty state - shown when the filtered session list is empty */}
            {filteredBookings.length === 0 ? (
                <BookingEmptyState
                    icon={<CalendarDays className="w-10 h-10 text-slate-300" />}
                    message={filterFacility !== '' || filterMember !== '' ? 'No sessions match your filters.' : 'No upcoming sessions.'}
                />
            ) : (
                // Sessions table
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
                            <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.date }}>
                                <SortHeader
                                    label="Date"
                                    dir={sortDir}
                                    onToggle={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                                />
                                <ResizeHandle onMouseDown={e => startResize('date', e.clientX, colWidths.date)} />
                            </div>
                            <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.time }}>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0 truncate">Time</span>
                                <ResizeHandle onMouseDown={e => startResize('time', e.clientX, colWidths.time)} />
                            </div>
                            <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.member }}>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0 truncate">Member</span>
                                <ResizeHandle onMouseDown={e => startResize('member', e.clientX, colWidths.member)} />
                            </div>
                            <div className="flex-1 min-w-40">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</span>
                            </div>
                        </div>

                        {/* Rows */}
                        {filteredBookings.map(b => {
                            const today = new Date().toISOString().split('T')[0];                               // Today's date as a YYYY-MM-DD string
                            const nowMins = new Date().getHours() * 60 + new Date().getMinutes();               // Current time in minutes since midnight
                            const canComplete = b.date < today || (b.date === today && nowMins >= b.slotStart); // Only allow once the session has started
                            const isExpanded = expandedId === b.id;                                             // Whether this row is expanded
                            return (
                                <div key={b.id} className="border-b border-slate-100 last:border-0">
                                    <div className="flex items-center px-4 py-4 hover:bg-slate-50/70 transition-colors min-w-max">
                                        <button
                                            className="w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                                            onClick={() => setExpandedId(isExpanded ? null : b.id)}
                                        >
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`} />
                                        </button>
                                        <div className="shrink-0 pr-4 min-w-0 overflow-hidden" style={{ width: colWidths.facility }}>
                                            <p className="text-sm font-semibold text-slate-900 truncate">{b.facilityName}</p>
                                        </div>
                                        <div className="shrink-0 pr-4 min-w-0 overflow-hidden" style={{ width: colWidths.location }}>
                                            <p className="text-sm text-slate-600 truncate">{facilityMap[b.facilityId]?.location ?? "—"}</p>
                                        </div>
                                        <div className="shrink-0 pr-4 min-w-0 overflow-hidden" style={{ width: colWidths.date }}>
                                            <p className="text-sm text-slate-700 truncate">{formatDate(b.date)}</p>
                                        </div>
                                        <div className="shrink-0 pr-4 min-w-0 overflow-hidden" style={{ width: colWidths.time }}>
                                            <p className="text-sm text-slate-700 truncate">{formatSlot(b.slotStart, b.slotEnd - b.slotStart)}</p>
                                        </div>
                                        <div className="shrink-0 pr-4 flex items-center gap-2 min-w-0 overflow-hidden" style={{ width: colWidths.member }}>
                                            <MemberAvatar name={b.memberName} />
                                            <p className="text-sm text-slate-700 truncate">{b.memberEmail ?? b.memberName}</p>
                                        </div>
                                        <div className="flex-1 min-w-40">
                                            <button 
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:enabled:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                                                onClick={() => handleMarkComplete(b)}
                                                disabled={processing === b.id || !canComplete}
                                                title={!canComplete ? "Session has not started yet" : undefined}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Mark Complete
                                            </button>
                                        </div>
                                    </div>
                                    {/* Intended activity */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 bg-slate-50/60">
                                            <div className="ml-8 border border-sky-200 bg-sky-50 rounded-xl px-3 py-2.5">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Intended Activity</p>
                                                <p className="text-sm text-slate-700 leading-snug">{b.activityDescription}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
