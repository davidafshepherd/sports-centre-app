'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

import { suggestAlternative } from '@/lib/bookingRequests';
import { getUpcomingBookingsForFacility } from '@/lib/bookings';
import { useAuth } from '@/providers/AuthProvider';
import type { BookingRequest } from '@/types/bookingRequest';
import type { Facility } from '@/types/facility';
import { getNext7Dates, getTotalSlots, availabilityCategory } from '@/lib/utils/slots';

import BookingCardPhoto from '../BookingCardPhoto';

// Shape of component's props
interface Props {
    request: BookingRequest;
    facilities: Facility[];
    onClose: () => void;
    onDone: () => void;
}

export default function AlternativeSuggestionModal({ request, facilities, onClose, onDone }: Props) {
    const { user } = useAuth();
    const [selectedFacilityId, setSelectedFacilityId] = useState('');                                           // Id of the selected alternative facility
    const [note, setNote] = useState('');                                                                       // Optional note to send with the suggestion
    const [availability, setAvailability] = useState<Record<string, { booked: number; total: number }>>({});    // Availability stats per facility
    const [loadingAvailability, setLoadingAvailability] = useState(true);                                       // Whether availability is being fetched
    const [submitting, setSubmitting] = useState(false);                                                        // Whether the form is being submitted
    const [error, setError] = useState('');                                                                     // Submission error message

    const requestedCategory = facilities.find(f => f.id === request.facilityId)?.category;
    const sameCategoryFacilities = facilities.filter(
        f => f.category === requestedCategory && f.isActive && f.id !== request.facilityId
    );

    // Fetch availability for all same-category facilities on mount
    useEffect(() => {
        const dates = getNext7Dates();
        const targets = facilities.filter(f => f.category === requestedCategory && f.isActive);
        if (targets.length === 0) { setLoadingAvailability(false); return; }
        Promise.all(
            targets.map(f =>
                getUpcomingBookingsForFacility(f.id).then(bookings => {
                    const booked = bookings.filter(b => dates.includes(b.date)).length;
                    const total = getTotalSlots(f, dates);
                    return [f.id, { booked, total }] as const;
                })
            )
        ).then(entries => {
            setAvailability(Object.fromEntries(entries));
            setLoadingAvailability(false);
        });
    }, [requestedCategory, facilities]);

    // Submit the alternative suggestion
    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!user || !selectedFacilityId) return;
        const selected = sameCategoryFacilities.find(f => f.id === selectedFacilityId)!;
        setSubmitting(true);
        setError('');
        try {
            await suggestAlternative(request.id, request, user.uid, {
                facilityId:   selectedFacilityId,
                facilityName: selected.name,
                note,
            });
            onDone();
        } catch {
            setError('Failed to send suggestion. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Modal */}
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
                <BookingCardPhoto category={requestedCategory} name={request.facilityName} />
                <div className="px-6 pt-4 pb-1 shrink-0">
                    <h2 className="font-semibold text-slate-900">Suggest Alternative Facility</h2>
                </div>
                <form className="px-6 pb-6 pt-4 space-y-4 overflow-y-auto flex-1" onSubmit={handleSubmit}>
                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
                    {/* Availability list */}
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">
                            Availability - next 7 days
                            {loadingAvailability && <span className="ml-1 font-normal text-slate-400">(loading…)</span>}
                        </p>
                        <div className="space-y-2">
                            {sameCategoryFacilities.map(f => {
                                const avail = availability[f.id];                                                                               // Availability stats for this facility
                                const { label, colour } = avail ? availabilityCategory(avail.booked, avail.total) : { label: "", colour: "" };  // Availability label and colour for display
                                const isSelected = selectedFacilityId === f.id;                                                                 // Whether this facility is the selected alternative
                                return (
                                    <button 
                                        key={f.id} 
                                        className={[
                                            "w-full text-left px-4 py-3 rounded-xl border transition-colors cursor-pointer",
                                            isSelected ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                                        ].join(' ')}
                                        type="button"
                                        onClick={() => setSelectedFacilityId(f.id)}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900">{f.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />{f.location}
                                                </p>
                                            </div>
                                            {avail && (
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colour}`}>{label}</span>
                                                    <span className="text-xs text-slate-400">{avail.total - avail.booked}/{avail.total} slots</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (optional)</label>
                        <textarea 
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" 
                            rows={2} 
                            value={note}
                            placeholder="Reason for the alternative…"
                            onChange={e => setNote(e.target.value)}
                        />
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-3 pt-1">
                        <button 
                            className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 disabled:hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            type="submit" 
                            disabled={submitting || !selectedFacilityId}
                        >
                            {submitting ? "Sending…" : "Send Suggestion"}
                        </button>
                        <button 
                            className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
                            type="button" 
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
