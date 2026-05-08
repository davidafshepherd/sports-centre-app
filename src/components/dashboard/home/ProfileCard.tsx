'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, X, Check, Loader2 } from 'lucide-react';

import { updateUserProfile } from '@/lib/users';
import { useAuth } from '@/providers/AuthProvider';
import { inputClass, FieldError } from '@/lib/utils/formHelpers';
import { STATUS_BADGE } from '@/types/user';
import { profileFormSchema, type ProfileForm } from '@/lib/schemas/profileEditSchema';

export default function ProfileCard() {
    const { user, userProfile } = useAuth();              // Access authentication context
    const [editing, setEditing] = useState(false);        // Whether the card is in edit mode
    const [saving, setSaving] = useState(false);          // Whether a save is in progress


    // Initialise form with Zod validation 
    const form = useForm<ProfileForm>({
        resolver: zodResolver(profileFormSchema),
        mode: 'onChange',
    });

    // Function used to enter edit mode and pre-fill the form with the current profile values
    function startEdit() {
        if (!userProfile) return;
        form.reset({
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            dateOfBirth: userProfile.dateOfBirth,
            address: { ...userProfile.address },
        });
        setEditing(true);
    }

    // Function used to save the updated profile and exit edit mode
    async function onSubmit(data: ProfileForm) {
        if (!user) return;
        setSaving(true);
        await updateUserProfile(user.uid, data);
        setSaving(false);
        setEditing(false);
    }

    // Derive display values from the user's profile
    const initials = ((userProfile?.firstName?.[0] ?? '') + (userProfile?.lastName?.[0] ?? '')).toUpperCase();
    const memberSince = userProfile?.createdAt
        ? new Date(userProfile.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        : '-';
    const addr = userProfile?.address;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                {/* Avatar, name, email and status */}
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white text-lg font-bold shrink-0">
                        {initials || '?'}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            {userProfile?.firstName} {userProfile?.lastName}
                        </h2>
                        <p className="text-sm text-slate-500">{userProfile?.email ?? user?.email}</p>
                        {userProfile?.membershipStatus && (
                            <span className={`mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[userProfile.membershipStatus] ?? 'bg-slate-100 text-slate-600'}`}>
                                {userProfile.membershipStatus}
                            </span>
                        )}
                    </div>
                </div>
                {/* Edit profile button */}
                {!editing && (
                    <button
                        onClick={startEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit profile
                    </button>
                )}
            </div>

            {editing ? (
                /* Edit profile form */
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">First name</label>
                            <input {...form.register('firstName', { required: 'Required' })} className={inputClass(!!form.formState.errors.firstName)} type="text" />
                            <FieldError message={form.formState.errors.firstName?.message} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Last name</label>
                            <input {...form.register('lastName', { required: 'Required' })} className={inputClass(!!form.formState.errors.lastName)} type="text" />
                            <FieldError message={form.formState.errors.lastName?.message} />
                        </div>
                    </div>

                    {/* Date of birth */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Date of birth</label>
                        <input {...form.register('dateOfBirth', { required: 'Required' })} className={inputClass(!!form.formState.errors.dateOfBirth)} type="date" />
                        <FieldError message={form.formState.errors.dateOfBirth?.message} />
                    </div>

                    {/* Address */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Address</p>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Line 1</label>
                            <input {...form.register('address.line1', { required: 'Required' })} className={inputClass(!!form.formState.errors.address?.line1)} type="text" />
                            <FieldError message={form.formState.errors.address?.line1?.message} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Line 2 (optional)</label>
                            <input {...form.register('address.line2')} className={inputClass(false)} type="text" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Town / city</label>
                                <input {...form.register('address.townOrCity', { required: 'Required' })} className={inputClass(!!form.formState.errors.address?.townOrCity)} type="text" />
                                <FieldError message={form.formState.errors.address?.townOrCity?.message} />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">County</label>
                                <input {...form.register('address.county', { required: 'Required' })} className={inputClass(!!form.formState.errors.address?.county)} type="text" />
                                <FieldError message={form.formState.errors.address?.county?.message} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Postcode</label>
                            <input {...form.register('address.postcode', { required: 'Required' })} className={inputClass(!!form.formState.errors.address?.postcode)} type="text" />
                            <FieldError message={form.formState.errors.address?.postcode?.message} />
                        </div>
                    </div>

                    {/* Save + Cancel buttons */}
                    <div className="flex gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={saving || !form.formState.isDirty || !form.formState.isValid}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium hover:enabled:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            {saving ? 'Saving…' : 'Save changes'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditing(false)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                /* View mode: role + DoB + member since grid, then address below */
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Role</p>
                            <p className="text-sm font-medium text-slate-900 capitalize">{userProfile?.role ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Date of birth</p>
                            <p className="text-sm font-medium text-slate-900">{userProfile?.dateOfBirth ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Member since</p>
                            <p className="text-sm font-medium text-slate-900">{memberSince}</p>
                        </div>
                    </div>
                    {addr && (
                        <div className="pt-5 border-t border-slate-100">
                            <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">Address</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div className="col-span-2 sm:col-span-1">
                                    <p className="text-xs text-slate-400 mb-1">Street</p>
                                    <p className="text-sm font-medium text-slate-900 leading-snug truncate">
                                        {[addr.line1, addr.line2].filter(Boolean).join(', ') || '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Town / city</p>
                                    <p className="text-sm font-medium text-slate-900 truncate">{addr.townOrCity || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Postcode</p>
                                    <p className="text-sm font-medium text-slate-900 truncate">{addr.postcode || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">County</p>
                                    <p className="text-sm font-medium text-slate-900 truncate">{addr.county || '—'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
