'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { RegisterForm } from '@/lib/schemas/registerFormSchema';
import { inputClass, FieldError } from '@/lib/utils/formHelpers';

// Shape of component's props
interface Props {
    register: UseFormRegister<RegisterForm>;    // Function used to connect inputs to form state
    errors: FieldErrors<RegisterForm>;          // Input validation errors
    confirmPasswordError: string | undefined;   // Password mismatch error
}

export default function AccountDetailsFieldset({ register, errors, confirmPasswordError }: Props) {
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
            </div>
        </fieldset>
    );
}
