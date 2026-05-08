'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

import { cancelBookingsForFacility } from '@/lib/bookings';
import { cancelBookingRequestsForFacility } from '@/lib/bookingRequests';
import { deleteFacility } from '@/lib/facilities';
import type { Facility } from '@/types/facility';

// Shape of component's props
interface Props {
    facility: Facility;     // Facility to delete
    onClose: () => void;    // Function used to close the delete facility modal
    onDone: () => void;     // Function used to close the delete facility modal + re-fetch the facilities
}

export default function RemoveFacilityModal({ facility, onClose, onDone }: Props) {
    const [removing, setRemoving] = useState(false);            // Whether facility removal is in progress
    const [error, setError] = useState<string | null>(null);    // Submission error message

    // Function used to delete the facility
    async function handleRemove() {
        // Reset submission error
        setRemoving(true);
        setError(null);
        try {
            // Cancel facility's bookings + delete facility
            await cancelBookingRequestsForFacility(facility.id);
            await cancelBookingsForFacility(facility.id, 'the facility being removed');
            await deleteFacility(facility.id);
            onDone();
        } catch {
                // Update submission error message
            setError('Something went wrong. Please try again.');
            setRemoving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={e => { if (e.target === e.currentTarget && !removing) onClose(); }}
        >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900">Remove facility</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Are you sure you want to remove <span className="font-medium text-slate-700">{facility.name}</span>?
                        </p>
                    </div>
                </div>

                {/* Warning */}
                <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 space-y-1">
                    <p className="font-semibold">This will permanently:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-red-600">
                        <li>Cancel all pending booking requests</li>
                        <li>Cancel all upcoming bookings for this facility</li>
                        <li>Notify affected members of the cancellation</li>
                        <li>Delete the facility listing</li>
                    </ul>
                </div>

                {/* Error */}
                {error && <p className="mx-6 mb-4 text-sm text-red-600">{error}</p>}

                {/* Action buttons */}
                <div className="px-6 pb-6 flex items-center justify-end gap-2">
                    <button
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        onClick={handleRemove}
                        disabled={removing}
                    >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        {removing ? 'Removing…' : 'Remove facility'}
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        onClick={onClose}
                        disabled={removing}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
