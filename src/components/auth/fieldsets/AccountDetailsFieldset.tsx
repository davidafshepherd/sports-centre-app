'use client';

import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { RegisterForm } from '@/lib/schemas/registerFormSchema';
import { inputClass, FieldError } from '@/lib/utils/formHelpers';

// Shape of component's props
interface Props {
    register: UseFormRegister<RegisterForm>;    // Function used to connect inputs to form state
    errors: FieldErrors<RegisterForm>;          // Input validation errors
    confirmPasswordError: string | undefined;   // Password mismatch error
    setValue: UseFormSetValue<RegisterForm>;    // Function used to update form values programmatically
    role: 'member' | 'staff';                   // Currently selected account type
}

export default function AccountDetailsFieldset({ register, errors, confirmPasswordError, setValue, role }: Props) {

    return (
        <fieldset>
            {/* Section title */}
            <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Account details
            </legend>

            <div className="space-y-3">
                {/* Email input */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                    <input
                        {...register("email")}
                        className={inputClass(!!errors.email)}
                        id="email"
                        type="email"
                        autoComplete="email"
                    />
                    <FieldError message={errors.email?.message} />
                </div>
                {/* Password input */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                        {...register("password")}
                        className={inputClass(!!errors.password)}
                        id="password"
                        type="password"
                        autoComplete="new-password"
                    />
                    <FieldError message={errors.password?.message} />
                </div>
                {/* Confirm password input */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
                    <input
                        {...register("confirmPassword")}
                        className={inputClass(!!confirmPasswordError)}
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                    />
                    <FieldError message={confirmPasswordError} />
                </div>
            
                {/* Role selector */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account type</label>
                    <div className="grid grid-cols-2 gap-2">
                        {(['member', 'staff'] as const).map(r => (
                            <button
                                key={r}
                                className={[
                                    'py-2 rounded-md text-sm font-medium border transition-colors cursor-pointer',
                                    role === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50',
                                ].join(' ')}
                                type="button"
                                onClick={() => setValue('role', r, { shouldValidate: true })}
                            >
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                        ))}
                    </div>
                    {role === 'staff' && (
                        <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                            Staff accounts require admin approval before you can access the platform.
                        </p>
                    )}
                </div>
            </div>
        </fieldset>
    );
}
