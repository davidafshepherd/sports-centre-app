'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { createBookingRequest } from '@/lib/bookingRequests';
import { bookingRequestFormSchema, type BookingRequestForm } from '@/lib/schemas/bookingRequestFormSchema';
import { FieldError } from '@/lib/utils/formHelpers';
import { useAuth } from '@/providers/AuthProvider';
import type { Facility } from '@/types/facility';

import StepsIndicator from './StepsIndicator';

// Shape of component's props
interface Props {
    facility: Facility;     // Facility being requested
    onClose: () => void;    // Function used to close booking request modal
    onSuccess: () => void;  // Function used to refetch the member's booking requests
}

export default function BookingRequestFormCard({ facility, onClose, onSuccess }: Props) {
    // Access authentication context
    const { user, userProfile } = useAuth();

    const [submitError, setSubmitError] = useState<string | null>(null);    // Form submission error message
    const [success, setSuccess] = useState(false);                          // Whether the submission has been successful

    // Initialise form with Zod validation 
    const form = useForm<BookingRequestForm>({
        resolver: zodResolver(bookingRequestFormSchema),
    });

    // Handle form submission
    async function onSubmit(data: BookingRequestForm) {
        // Stop form submission if the user or profile is missing
        if (!user || !userProfile) return;

        // Reset form submission error
        setSubmitError(null);
        try {
            // Create booking request
            await createBookingRequest({
                memberId: user!.uid,
                memberName: `${userProfile!.firstName} ${userProfile!.lastName}`,
                memberEmail: user!.email ?? "",
                facilityId: facility.id,
                facilityName: facility.name,
                activityDescription: data.activityDescription,
            });

            // Set form submission as successful
            setSuccess(true);
        } catch {
            // Update form submission error message
            setSubmitError("Failed to submit request. Please try again.");
        }
    }

    return (
        <div className="bg-white rounded-2xl w-full max-w-md">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
                {/* Heading + facility name */}
                <div>
                    <h2 className="font-semibold text-slate-900">Request a Booking</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{facility.name}</p>
                </div>
                {/* Close button */}
                <button 
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
                {!success ? (
                    // Render 1st step in booking process
                    <div className="space-y-5">
                        { /* Booking step indicator */ }
                        <StepsIndicator step={1} />
                        { /* Booking request form */ }
                        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                            {/* Submission error message */}
                            {submitError && (
                                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{submitError}</p>
                            )}
                            {/* Activity description text area */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    What will you be doing?
                                </label>
                                <textarea
                                    {...form.register("activityDescription")} rows={3}
                                    className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none placeholder:text-slate-400"
                                    placeholder="e.g. Casual badminton session with friends, practising serves and rallies."
                                />
                                <FieldError message={form.formState.errors.activityDescription?.message} />
                            </div>
                            {/* Submit button */}
                            <button 
                                className="w-full py-3 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 transition-colors shadow-sm cursor-pointer"
                                type="submit" 
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? "Submitting…" : "Submit Request"}
                            </button>
                        </form>
                    </div>
                ) : (
                    // Render 2nd step in booking process
                    <div className="space-y-5">
                        { /* Booking step indicator */ }
                        <StepsIndicator step={2} />
                        { /* Submitted booking request form */ }
                        <div className="text-center py-4">
                            { /* Success icon */ }
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            { /* Success heading + description */ }
                            <p className="font-semibold text-slate-900">Request submitted!</p>
                            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                                Staff will review your request within 1–2 days. Once approved, go to Bookings to pick a time slot.
                            </p>
                            { /* Done button */ }
                            <button 
                                className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors cursor-pointer"
                                onClick={() => { onSuccess(); onClose() }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
