'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Plus, Trash2, X } from 'lucide-react';

import { createFacility } from '@/lib/facilities';
import { applyFacilityEdit, previewCancellationsForFacilityEdit } from '@/lib/FacilityForm';
import { facilityFormSchema, type FacilityForm } from '@/lib/schemas/facilityFormSchema';
import { FieldError } from '@/lib/utils/formHelpers';
import { getStaffUsers } from '@/lib/users';
import { DAY_LABELS, WEEK_DAYS } from '@/lib/utils/openingHours';
import { CATEGORY_LABELS } from '@/types/facility';
import type { Facility, FacilityCategory, OpeningHours } from '@/types/facility';
import type { UserProfile } from '@/types/user';

// Available time slot duration options
const SLOT_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120];

// Formats a slot duration in minutes as a human-readable string
function formatSlotDuration(mins: number): string {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m} min`;
}

// Default opening hours for a new facility
const CLOSED_HOURS: OpeningHours = {
    monday: null, tuesday: null, wednesday: null, thursday: null,
    friday: null, saturday: null, sunday: null,
};

// Function used to create the default values of the form 
function buildDefaultValues(facility: Facility | null): FacilityForm {
    if (facility) {
        return {
            name: facility.name,
            category: facility.category,
            description: facility.description,
            location: facility.location,
            maxCapacity: facility.maxCapacity,
            slotDurationMins: facility.slotDurationMins,
            openingHours: facility.openingHours,
            usageGuidelines: [...facility.usageGuidelines],
            isActive: facility.isActive,
            assignedStaffIds: [...facility.assignedStaffIds],
        };
    }
    return {
        name: '',
        category: 'badminton',
        description: '',
        location: '',
        maxCapacity: 10,
        slotDurationMins: 60,
        openingHours: { ...CLOSED_HOURS },
        usageGuidelines: [],
        isActive: true,
        assignedStaffIds: [],
    };
}

// Tailwind CSS classes for input fields, labels and sections
const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent';
const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';
const sectionCls = 'space-y-1.5';

// Shape of component's props
interface Props {
    facility: Facility | null;  // Facility to edit (null if creating)
    onClose: () => void;        // Function used to close the facility form modal
    onDone: () => void;         // Function used to close the facility form modal + re-fetch the facilities
}

export default function FacilityFormModal({ facility, onClose, onDone }: Props) {
    const isEdit = facility !== null;

    const [allStaff, setAllStaff] = useState<UserProfile[]>([]);                        // All staff members
    const [saving, setSaving] = useState(false);                                        // Whether facility creation / edit is in progress
    const [submitError, setSubmitError] = useState<string | null>(null);                // Form submission error message
    const [cancellationCount, setCancellationCount] = useState<number | null>(null);    // Number of cancellations that would be caused by the facility edit
    const [pendingData, setPendingData] = useState<FacilityForm | null>(null);          // Validated form data held between the two confirmation steps

    // Initialise form with Zod validation 
    const form = useForm<FacilityForm>({
        resolver: zodResolver(facilityFormSchema),
        defaultValues: buildDefaultValues(facility),
        mode: 'onChange',
    });

    // Watch opening hours, usage guidelines, assigned staff IDs and isActive fields
    const openingHours = useWatch({ control: form.control, name: 'openingHours' });
    const usageGuidelines = useWatch({ control: form.control, name: 'usageGuidelines' });
    const assignedStaffIds = useWatch({ control: form.control, name: 'assignedStaffIds' });
    const isActive = useWatch({ control: form.control, name: 'isActive' });

    // Fetch all staff members for the staff assignment
    useEffect(() => {
        getStaffUsers().then(staff =>
            setAllStaff(staff.sort((a, b) =>
                `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
            )),
        );
    }, []);

    // Function used toggle a day open or closed (resets to default hours when opened)
    function setDayOpen(day: keyof OpeningHours, open: boolean) {
        form.setValue('openingHours', {
            ...openingHours,
            [day]: open ? { open: '09:00', close: '18:00' } : null,
        }, { shouldDirty: true, shouldValidate: true });
    }

    // Function used to update the open or close time for a specific day
    function setDayTime(day: keyof OpeningHours, field: 'open' | 'close', value: string) {
        const current = openingHours[day];
        if (!current) return;
        form.setValue('openingHours', {
            ...openingHours,
            [day]: { ...current, [field]: value },
        }, { shouldDirty: true, shouldValidate: true });
    }

    // Function used to append a blank guideline entry
    function addGuideline() {
        form.setValue('usageGuidelines', [...usageGuidelines, ''], { shouldDirty: true });
    }

    // Function used to update the text of a guideline at a given index
    function setGuideline(index: number, value: string) {
        form.setValue('usageGuidelines', usageGuidelines.map((g, i) => i === index ? value : g), { shouldDirty: true });
    }

    // Function used to remove a guideline at a given index
    function removeGuideline(index: number) {
        form.setValue('usageGuidelines', usageGuidelines.filter((_, i) => i !== index), { shouldDirty: true, shouldValidate: true });
    }

    // Handle form submission
    async function onSubmit(data: FacilityForm) {
        // Reset form submission error
        setSubmitError(null);
        if (isEdit && facility) {
            try {
                // Check how many bookings would be cancelled by this edit
                const count = await previewCancellationsForFacilityEdit(facility.id, facility, data);
                if (0 < count) {
                    setPendingData(data);
                    setCancellationCount(count);
                    return;
                }
            } catch {
                // Update form submission error message
                setSubmitError('Something went wrong. Please try again.');
                return;
            }
        }
        // Save new / edited facility
        await doSave(data);
    }

    // Function used to save the new / edited facility
    async function doSave(data: FacilityForm) {
        // Reset form submission error
        setSaving(true);
        setSubmitError(null);
        try {
            // Save new / edited facility
            if (isEdit && facility) {
                await applyFacilityEdit(facility, data);
            } else {
                await createFacility(data);
            }
            onDone();
        } catch {
            // Update form submission error message
            setSubmitError('Something went wrong. Please try again.');
            setSaving(false);
        }
    }

    // First error from opening hours superRefine (keyed by day)
    const openingHoursError = form.formState.errors.openingHours
        ? Object.values(form.formState.errors.openingHours as Record<string, { message?: string }>)
            .find(e => e?.message)?.message
        : undefined;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={e => { if (e.target === e.currentTarget && !form.formState.isSubmitting && !saving && cancellationCount === null) onClose(); }}
        >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <h2 className="font-semibold text-slate-900">
                        {isEdit ? 'Edit facility' : 'Create facility'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Facility form */}
                <form id="facility-form" onSubmit={form.handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
                    {/* Basic info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`col-span-2 sm:col-span-1 ${sectionCls}`}>
                            <label className={labelCls}>Name</label>
                            <input
                                {...form.register('name')}
                                className={inputCls}
                                placeholder="e.g. Court A"
                            />
                            <FieldError message={form.formState.errors.name?.message} />
                        </div>
                        <div className={`col-span-2 sm:col-span-1 ${sectionCls}`}>
                            <label className={labelCls}>Category</label>
                            <select
                                {...form.register('category')}
                                className={inputCls}
                            >
                                {(Object.keys(CATEGORY_LABELS) as FacilityCategory[]).map(cat => (
                                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                                ))}
                            </select>
                        </div>
                        <div className={`col-span-2 ${sectionCls}`}>
                            <label className={labelCls}>Location</label>
                            <input
                                {...form.register('location')}
                                className={inputCls}
                                placeholder="e.g. Block B, Ground Floor"
                            />
                            <FieldError message={form.formState.errors.location?.message} />
                        </div>
                        <div className={`col-span-2 ${sectionCls}`}>
                            <label className={labelCls}>Description</label>
                            <textarea
                                {...form.register('description')}
                                className={`${inputCls} resize-none`}
                                rows={3}
                                placeholder="Brief description of the facility…"
                            />
                            <FieldError message={form.formState.errors.description?.message} />
                        </div>
                    </div>

                    {/* Capacity & slot duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={sectionCls}>
                            <label className={labelCls}>Max Capacity</label>
                            <input
                                {...form.register('maxCapacity', { valueAsNumber: true })}
                                className={inputCls}
                                type="number"
                                min={1}
                            />
                            <FieldError message={form.formState.errors.maxCapacity?.message} />
                        </div>
                        <div className={sectionCls}>
                            <label className={labelCls}>Slot Duration</label>
                            <select
                                {...form.register('slotDurationMins', { valueAsNumber: true })}
                                className={inputCls}
                            >
                                {SLOT_OPTIONS.map(mins => (
                                    <option key={mins} value={mins}>{formatSlotDuration(mins)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Opening hours */}
                    <div className={sectionCls}>
                        <label className={labelCls}>Opening Hours</label>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            {WEEK_DAYS.map((day, i) => {
                                const h = openingHours[day];
                                const isOpen = h !== null;
                                return (
                                    <div
                                        key={day}
                                        className={`flex items-center gap-3 px-4 py-2.5 ${i < WEEK_DAYS.length - 1 ? 'border-b border-slate-100' : ''}`}
                                    >
                                        {/* Day toggle */}
                                        <label className="flex items-center gap-2 w-16 cursor-pointer shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={isOpen}
                                                onChange={e => setDayOpen(day, e.target.checked)}
                                                className="w-3.5 h-3.5 accent-sky-600"
                                            />
                                            <span className="text-sm font-medium text-slate-700">{DAY_LABELS[day]}</span>
                                        </label>

                                        {/* Time inputs or closed label */}
                                        {isOpen && h ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={h.open}
                                                    onChange={e => setDayTime(day, 'open', e.target.value)}
                                                    className="text-sm px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                />
                                                <span className="text-slate-400 text-sm">–</span>
                                                <input
                                                    type="time"
                                                    value={h.close}
                                                    onChange={e => setDayTime(day, 'close', e.target.value)}
                                                    className="text-sm px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">Closed</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {openingHoursError && <p className="mt-1 text-xs text-red-600">{openingHoursError}</p>}
                    </div>

                    {/* Usage guidelines */}
                    <div className={sectionCls}>
                        <label className={labelCls}>Usage Guidelines</label>
                        <div className="space-y-2">
                            {usageGuidelines.map((g, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        className={`${inputCls} flex-1`}
                                        value={g}
                                        onChange={e => setGuideline(i, e.target.value)}
                                        placeholder={`Guideline ${i + 1}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeGuideline(i)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addGuideline}
                                className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors cursor-pointer"
                            >
                                <Plus className="w-4 h-4" /> Add guideline
                            </button>
                        </div>
                    </div>

                    {/* Assigned staff */}
                    <div className={sectionCls}>
                        <label className={labelCls}>Assigned Staff</label>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            {allStaff.length === 0 ? (
                                <p className="text-sm text-slate-400 italic px-4 py-3">No staff members available.</p>
                            ) : (
                                allStaff.map((staff, i) => (
                                    <label
                                        key={staff.uid}
                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 ${i < allStaff.length - 1 ? 'border-b border-slate-100' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={assignedStaffIds.includes(staff.uid)}
                                            onChange={e => form.setValue(
                                                'assignedStaffIds',
                                                e.target.checked
                                                    ? [...assignedStaffIds, staff.uid]
                                                    : assignedStaffIds.filter(id => id !== staff.uid),
                                                { shouldDirty: true },
                                            )}
                                            className="w-3.5 h-3.5 accent-sky-600 shrink-0"
                                        />
                                        <span className="text-sm text-slate-700 flex-1">
                                            {staff.firstName} {staff.lastName}
                                        </span>
                                        <span className="text-xs text-slate-400">{staff.email}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center justify-between py-3 border-t border-slate-100">
                        <div>
                            <p className="text-sm font-medium text-slate-700">Active</p>
                            <p className="text-xs text-slate-500">Inactive facilities are hidden from members and staff.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => form.setValue('isActive', !isActive, { shouldDirty: true })}
                            className={[
                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                                isActive ? 'bg-sky-600' : 'bg-slate-200',
                            ].join(' ')}
                        >
                            <span className={[
                                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                                isActive ? 'translate-x-6' : 'translate-x-1',
                            ].join(' ')} />
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0 gap-4">
                    {submitError ? (
                        <p className="text-sm text-red-600 flex-1">{submitError}</p>
                    ) : (
                        <span />
                    )}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-600 transition-colors cursor-pointer"
                            type="submit"
                            form="facility-form"
                            disabled={form.formState.isSubmitting || saving || !form.formState.isValid || (isEdit && !form.formState.isDirty)}
                        >
                            {saving
                                ? (isEdit ? 'Saving…' : 'Creating…')
                                : form.formState.isSubmitting
                                    ? 'Checking…'
                                    : (isEdit ? 'Save changes' : 'Create facility')
                            }
                        </button>
                        <button
                            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            type="button"
                            onClick={onClose}
                            disabled={form.formState.isSubmitting || saving}
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Cancellation confirmation overlay (shown when bookings would be cancelled) */}
                {cancellationCount !== null && (
                    <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center p-8 gap-5">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="text-center space-y-1 max-w-xs">
                            <p className="font-semibold text-slate-900">Confirm changes</p>
                            <p className="text-sm text-slate-600">
                                {cancellationCount} booking{cancellationCount !== 1 ? 's' : ''} will be cancelled
                                and affected members will be notified.
                            </p>
                        </div>
                        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                        <div className="flex gap-3">
                            <button
                                className="px-5 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                                type="button"
                                onClick={() => setCancellationCount(null)}
                                disabled={saving}
                            >
                                Back
                            </button>
                            <button
                                className="px-5 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                type="button"
                                onClick={() => { if (pendingData) doSave(pendingData); }}
                                disabled={saving}
                            >
                                {saving ? 'Saving…' : 'Confirm & save'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
