'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';

import type { Booking, BookingStatus } from '@/types/booking';
import type { Facility, FacilityCategory } from '@/types/facility';
import { CATEGORY_CONFIG, CATEGORY_LABELS } from '@/types/facility';
import { formatDate, formatSlot } from '@/lib/utils/date';
import { bookingStatusColour, bookingStatusLabel } from '@/lib/utils/status';

import { BookingEmptyState } from '../BookingEmptyState';
import { SortDir, SortHeader, ResizeHandle, makeResizer } from '@/lib/utils/bookingTableHelpers';
import BookingFilterBar from '../BookingFilterBar';

// Shape of component's props
interface Props {
    bookings: Booking[];
    facilityMap: Record<string, Facility>;
}

export default function MemberHistoryTab({ bookings, facilityMap }: Props) {
    const [sortDir, setSortDir] = useState<SortDir>('desc');                                                            // Sort direction for the table
    const [filterCategory, setFilterCategory] = useState('');                                                           // Active category filter
    const [filterStatus, setFilterStatus] = useState('');                                                               // Active status filter
    const [colWidths, setColWidths] = useState({ facility: 176, location: 144, category: 132, date: 136, time: 148 });  // Column widths in px
    const startResize = makeResizer<typeof colWidths>(setColWidths);                                                    // Drag handler for column resizing
    const [expandedId, setExpandedId] = useState<string | null>(null);                                                  // Currently expanded row id

    // Unique categories and statuses from the current bookings, for the filter dropdowns
    const categoryOptions = [...new Set(
        bookings.map(b => facilityMap[b.facilityId]?.category).filter(Boolean),
    )].sort() as FacilityCategory[];
    const statusOptions = [...new Set(bookings.map(b => b.status))].sort() as BookingStatus[];

    // Filter and sort the bookings
    const filteredBookings = bookings
        .filter(b => filterCategory === '' || facilityMap[b.facilityId]?.category === filterCategory)
        .filter(b => filterStatus === '' || b.status === filterStatus)
        .sort((a, b) => {
            const ka = a.date + String(a.slotStart).padStart(5, '0');
            const kb = b.date + String(b.slotStart).padStart(5, '0');
            return sortDir === 'desc' ? kb.localeCompare(ka) : ka.localeCompare(kb);
        });

    return (
        <>
            {/* Filter bar */}
            <BookingFilterBar
                selects={[
                    {
                        value: filterCategory,
                        onChange: setFilterCategory,
                        placeholder: 'All categories',
                        options: categoryOptions.map(cat => ({ value: cat, label: CATEGORY_LABELS[cat] })),
                    },
                    {
                        value: filterStatus,
                        onChange: setFilterStatus,
                        placeholder: 'All statuses',
                        options: statusOptions.map(s => ({ value: s, label: bookingStatusLabel(s) })),
                        width: 'w-40',
                    },
                ]}
                hasFilters={filterCategory !== '' || filterStatus !== ''}
                onClear={() => { setFilterCategory(''); setFilterStatus(''); }}
            />

            {/* Empty state - shown when the filtered history list is empty */}
            {filteredBookings.length === 0 ? (
                <BookingEmptyState
                    icon={<CalendarDays className="w-10 h-10 text-slate-300" />}
                    message={filterCategory !== '' || filterStatus !== '' ? 'No bookings match your filters.' : 'No booking history yet.'}
                />
            ) : (
                // Bookings table
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
                            <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.category }}>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0 truncate">Category</span>
                                <ResizeHandle onMouseDown={e => startResize('category', e.clientX, colWidths.category)} />
                            </div>
                            <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.date }}>
                                <SortHeader
                                    label="Date"
                                    dir={sortDir}
                                    onToggle={() => setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')}
                                />
                                <ResizeHandle onMouseDown={e => startResize('date', e.clientX, colWidths.date)} />
                            </div>
                            <div className="relative shrink-0 pr-4 flex items-center overflow-hidden" style={{ width: colWidths.time }}>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0 truncate">Time</span>
                                <ResizeHandle onMouseDown={e => startResize('time', e.clientX, colWidths.time)} />
                            </div>
                            <div className="flex-1 min-w-32">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                            </div>
                        </div>

                        {/* Rows */}
                        {filteredBookings.map(b => {
                            const category = facilityMap[b.facilityId]?.category;   // Category of the booked facility
                            const isExpanded = expandedId === b.id;                 // Whether this row is expanded
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
                                        <div className="shrink-0 pr-4 overflow-hidden flex items-center" style={{ width: colWidths.category }}>
                                            {category ? <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white whitespace-nowrap min-w-0 overflow-hidden ${CATEGORY_CONFIG[category].bg}`}>{CATEGORY_LABELS[category]}</span> : <span className="text-xs text-slate-400">—</span>}
                                        </div>
                                        <div className="shrink-0 pr-4 min-w-0 overflow-hidden" style={{ width: colWidths.date }}>
                                            <p className="text-sm text-slate-600 truncate">{formatDate(b.date)}</p>
                                        </div>
                                        <div className="shrink-0 pr-4 min-w-0 overflow-hidden" style={{ width: colWidths.time }}>
                                            <p className="text-sm text-slate-600 truncate">{formatSlot(b.slotStart, b.slotEnd - b.slotStart)}</p>
                                        </div>
                                        <div className="flex-1 min-w-32 flex items-center">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap min-w-0 overflow-hidden ${bookingStatusColour(b.status)}`}>
                                                {bookingStatusLabel(b.status)}
                                            </span>
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
