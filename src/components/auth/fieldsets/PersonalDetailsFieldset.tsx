'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { RegisterForm } from '@/lib/schemas/registerFormSchema';
import { inputClass, FieldError } from '@/lib/utils/formHelpers';

// Shape of component's props
interface Props {
    register: UseFormRegister<RegisterForm>;    // Function used to connect inputs to form state
    errors: FieldErrors<RegisterForm>;          // Input validation errors
}

export default function PersonalDetailsFieldset({ register, errors }: Props) {
    return (
        <fieldset>
            {/* Section title */}
            <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Personal details
            </legend>

            {/* First and last name inputs (2-column layout) */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">First name</label>
                    <input
                        {...register("firstName")}
                        className={inputClass(!!errors.firstName)}
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                    />
                    <FieldError message={errors.firstName?.message} />
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
                    <input
                        {...register("lastName")}
                        className={inputClass(!!errors.lastName)}
                        id="lastName"
                        type="text"
                        autoComplete="family-name"
                    />
                    <FieldError message={errors.lastName?.message} />
                </div>
            </div>

            {/* Date of birth input */}
            <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-1">Date of birth</label>
                <input
                    {...register("dateOfBirth")}
                    className={inputClass(!!errors.dateOfBirth)}
                    id="dateOfBirth"
                    type="date"
                />
                <FieldError message={errors.dateOfBirth?.message} />
            </div>
        </fieldset>
    );
}
