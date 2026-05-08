'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

import { confirmBookingSlot } from '@/lib/bookingRequests';
import { getBookingsForFacility } from '@/lib/bookings';
import { getFacilityById } from '@/lib/facilities';
import { useAuth } from '@/providers/AuthProvider';
import type { BookingRequest } from '@/types/bookingRequest';
import type { Booking } from '@/types/booking';
import type { Facility } from '@/types/facility';
import { getMinBookingDate, getMaxBookingDate } from '@/lib/utils/date';
import { getSlotsForFacilityDate } from '@/lib/utils/slots';

import BookingCardPhoto from '../BookingCardPhoto';
import SlotGrid from '../SlotGrid';

// Shape of component's props
interface Props {
    request: BookingRequest;
    onClose: () => void;
    onDone: () => void;
}

export default function ConfirmSlotModal({ request, onClose, onDone }: Props) {
    const { user } = useAuth();
    const [facility, setFacility] = useState<Facility | null>(null);            // Fetched facility data
    const [date, setDate] = useState('');                                       // Selected date
    const [slotStart, setSlotStart] = useState(-1);                             // Selected slot start (minutes)
    const [existingBookings, setExistingBookings] = useState<Booking[]>([]);    // Existing bookings on the selected date
    const [loadingSlots, setLoadingSlots] = useState(false);                    // Whether slots are being loaded
    const [submitting, setSubmitting] = useState(false);                        // Whether the form is being submitted
    const [error, setError] = useState('');                                     // Submission error message

    // Fetch facility data on mount
    useEffect(() => {
        getFacilityById(request.facilityId).then(f => setFacility(f));
    }, [request.facilityId]);

    const today = new Date().toISOString().split('T')[0];
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    const slotDurMins = facility?.slotDurationMins ?? 60;
    const maxCap = facility?.maxCapacity ?? 1;

    const allSlots = facility ? getSlotsForFacilityDate(facility, date) : [];

    // Hide slots that have already started today
    const visibleSlots = date === today ? allSlots.filter(slot => slot >= nowMins) : allSlots;

    // Slots unavailable because they're at capacity or the member already has an overlapping booking.
    // A booking occupies a slot if their time ranges overlap: [slotStart, slotStart+dur) ∩ [b.slotStart, b.slotEnd).
    // This correctly handles slot-duration changes — existing bookings can span multiple new slots.
    const unavailableSlots = allSlots.filter(slot => {
        const slotEnd = slot + slotDurMins;
        const overlapping = existingBookings.filter(b => b.slotStart < slotEnd && b.slotEnd > slot);
        const atCapacity = overlapping.length >= maxCap;
        const userBooked = overlapping.some(b => b.memberId === user?.uid);
        return atCapacity || userBooked;
    });

    // Reload existing bookings whenever the date changes
    useEffect(() => {
        if (!date) return;
        setSlotStart(-1);
        setLoadingSlots(true);
        getBookingsForFacility(request.facilityId, date)
            .then(bookings => setExistingBookings(bookings))
            .finally(() => setLoadingSlots(false));
    }, [request.facilityId, date]);

    // Submit the slot confirmation
    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!user || slotStart === -1) return;
        setSubmitting(true);
        setError('');
        try {
            await confirmBookingSlot(request.id, request, date, slotStart, slotDurMins);
            onDone();
        } catch {
            setError('Failed to confirm booking. Please try again.');
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
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
                <BookingCardPhoto category={facility?.category} name={request.facilityName} />
                <div className="px-6 pt-4 pb-1">
                    <h2 className="font-semibold text-slate-900">Select a Time Slot</h2>
                </div>
                <form className="px-6 pb-6 pt-4 space-y-4" onSubmit={handleSubmit}>
                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
                    {/* Date picker */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                        <input 
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer" 
                            type="date" 
                            required value={date}
                            min={getMinBookingDate()} 
                            max={getMaxBookingDate()}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                    {/* No slots warning */}
                    {date && facility && visibleSlots.length === 0 && (
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">
                                    {allSlots.length === 0 ? "Facility closed" : "No slots left today"}
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    {allSlots.length === 0 ? "This facility is closed on the selected date. Try a different day." : "All time slots for today have passed or are taken. Try a future date."}
                                </p>
                            </div>
                        </div>
                    )}
                    {/* Slot grid */}
                    {date && facility && visibleSlots.length > 0 && (
                        <SlotGrid 
                            slots={visibleSlots} 
                            booked={unavailableSlots} 
                            selected={slotStart}
                            loading={loadingSlots} 
                            onSelect={setSlotStart}
                            slotDurationMins={slotDurMins} 
                        />
                    )}
                    {/* Action buttons */}
                    <div className="flex gap-3 pt-1">
                        <button 
                            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            type="submit" 
                            disabled={submitting || slotStart === -1 || !date}
                        >
                            {submitting ? "Confirming…" : "Confirm Booking"}
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
