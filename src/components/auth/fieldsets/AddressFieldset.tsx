'use client';

import { useState } from 'react';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { RegisterForm } from '@/lib/schemas/registerFormSchema';
import { inputClass, FieldError } from '@/lib/utils/formHelpers';

// Shape of component's props
interface Props {
    register: UseFormRegister<RegisterForm>;    // Function used to connect inputs to form state
    errors: FieldErrors<RegisterForm>;          // Input validation errors
    setValue: UseFormSetValue<RegisterForm>;    // Function used to update form values programmatically
}

// Shape of data returned by IdealPostcodes API
interface AddressResult {
    line_1: string;
    line_2: string;
    line_3: string;
    post_town: string;
    county: string;
    postcode: string;
}

export default function AddressFieldset({ register, errors, setValue }: Props) {
    const [addressStep, setAddressStep] = useState<'postcode' | 'select' | 'fields'>('postcode');   // Address input step
    const [postcodeInput, setPostcodeInput] = useState("");                                         // Postcode entered for lookup
    const [addresses, setAddresses] = useState<AddressResult[]>([]);                                // Postcode lookup results
    const [lookupLoading, setLookupLoading] = useState(false);                                      // Whether lookup is in progress
    const [lookupError, setLookupError] = useState<string | null>(null);                            // Postcode lookup error message

    // Lookup addresses matching postcode input using IdealPostcodes API
    async function findAddress() {
        // Check if postcode input is empty
        if (!postcodeInput.trim()) {
            setLookupError('Please enter a postcode.');
            return;
        }
        
        // Begin lookup
        setLookupLoading(true);
        setLookupError(null);

        try {
            // Fetch addresses
            const res = await fetch(
                `/api/postcode-lookup?postcode=${encodeURIComponent(postcodeInput.trim())}`
            );
            const data = await res.json();

            // Show error if no results returned
            if (!res.ok || !data.result || data.result.length === 0) {
                setLookupError('No addresses found. Please check the postcode or enter your address manually.');
                return;
            }
            
            // Store results
            setAddresses(data.result);
            setAddressStep("select");
        } catch {
            setLookupError('Address lookup failed. Please try again or enter your address manually.');
        } finally {
            setLookupLoading(false);
        }
    }

    // Fill address fields with selected address
    function selectAddress(index: number) {
        // Store selected address
        const addr = addresses[index];
        if (!addr) return;

        // Combine address line 2 and address line 3
        const line2 = [addr.line_2, addr.line_3].filter(Boolean).join(', ');

        // Update form values with selected address
        setValue('address.line1', addr.line_1, { shouldValidate: true });
        setValue('address.line2', line2, { shouldValidate: true });
        setValue('address.townOrCity', addr.post_town, { shouldValidate: true });
        setValue('address.county', addr.county, { shouldValidate: true });
        setValue('address.postcode', addr.postcode, { shouldValidate: true });
        setAddressStep('fields');
    }

    // Reset postcode lookup
    function resetAddress() {
        // Reset lookup state
        setPostcodeInput('');
        setAddresses([]);
        setLookupError(null);
        setAddressStep('postcode');

        // Clear address fields
        setValue('address.line1', '');
        setValue('address.line2', '');
        setValue('address.townOrCity', '');
        setValue('address.county', '');
        setValue('address.postcode', '');
    }

    return (
        <fieldset>
            {/* Section title */}
            <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Your address
            </legend>

            {/* Step 1: postcode lookup */}
            {addressStep === "postcode" && (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        {/* Postcode input */}
                        <div className="flex-1">
                            <label htmlFor="postcodeInput" className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
                            <input
                                className={inputClass(!!lookupError)}
                                id="postcodeInput"
                                type="text"
                                placeholder="e.g. SW1A 2AA"
                                value={postcodeInput}
                                onChange={(e) => {
                                    setPostcodeInput(e.target.value);   // Update postcode input (state value)
                                    setLookupError(null);               // Clear old lookup error
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        findAddress();
                                    }
                                }}
                                autoComplete="postal-code"
                            />
                        </div>
                        {/* Lookup button */}
                        <div className="flex items-end">
                            <button
                                className="px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:hover:bg-slate-800 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                                type="button"
                                onClick={findAddress}
                                disabled={lookupLoading}
                            >
                                {lookupLoading ? "Searching…" : "Find my address"}
                            </button>
                        </div>
                    </div>
                    {/* Lookup error message */}
                    {lookupError && (
                        <p className="text-xs text-red-600">{lookupError}</p>
                    )}
                    {/* Switch to manual address entry */}
                    <button
                        className="text-xs text-slate-500 underline hover:text-slate-800 cursor-pointer"
                        type="button"
                        onClick={() => setAddressStep("fields")}
                    >
                        Enter address manually
                    </button>
                </div>
            )}

            {/* Step 2: address selection */}
            {addressStep === "select" && (
                <div className="space-y-2">
                    {/* Result count */}
                    <label htmlFor="addressSelect" className="block text-sm font-medium text-slate-700 mb-1">
                        {addresses.length} address{addresses.length !== 1 ? "es" : ""} found
                    </label>
                    {/* Address dropdown */}
                    <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                        id="addressSelect"
                        defaultValue=""
                        onChange={(e) => selectAddress(Number(e.target.value))}
                    >
                        <option value="" disabled>Select your address</option>
                        {addresses.map((addr, i) => (
                            <option key={i} value={i}>
                                {[addr.line_1, addr.line_2, addr.line_3].filter(Boolean).join(", ")}
                            </option>
                        ))}
                    </select>
                    <div className="flex gap-3">
                        {/* Restart lookup button */}
                        <button
                            className="text-xs text-slate-500 underline hover:text-slate-800 cursor-pointer"
                            type="button"
                            onClick={resetAddress}
                        >
                            Change postcode
                        </button>
                        <span className="text-xs text-slate-300">|</span>
                        {/* Switch to manual address entry */}
                        <button
                            className="text-xs text-slate-500 underline hover:text-slate-800 cursor-pointer"
                            type="button"
                            onClick={() => setAddressStep("fields")}
                        >
                            Enter address manually
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: editable address fields */}
            {addressStep === "fields" && (
                <div className="space-y-3">
                    {/* Address line 1 input */}
                    <div>
                        <label htmlFor="address.line1" className="block text-sm font-medium text-slate-700 mb-1">Address line 1</label>
                        <input
                            {...register("address.line1")}
                            className={inputClass(!!errors.address?.line1)}
                            id="address.line1"
                            type="text"
                            autoComplete="address-line1"
                        />
                        <FieldError message={errors.address?.line1?.message} />
                    </div>
                    {/* Address line 2 input */}
                    <div>
                        <label htmlFor="address.line2" className="block text-sm font-medium text-slate-700 mb-1">
                            Address line 2{" "}
                            <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <input
                            {...register("address.line2")}
                            className={inputClass(false)}
                            id="address.line2"
                            type="text"
                            autoComplete="address-line2"
                        />
                    </div>
                    {/* Town/city and county inputs (2-column layout) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="address.townOrCity" className="block text-sm font-medium text-slate-700 mb-1">Town or city</label>
                            <input
                                {...register("address.townOrCity")}
                                className={inputClass(!!errors.address?.townOrCity)}
                                id="address.townOrCity"
                                type="text"
                                autoComplete="address-level2"
                            />
                            <FieldError message={errors.address?.townOrCity?.message} />
                        </div>
                        <div>
                            <label htmlFor="address.county" className="block text-sm font-medium text-slate-700 mb-1">County</label>
                            <input
                                {...register("address.county")}
                                className={inputClass(!!errors.address?.county)}
                                id="address.county"
                                type="text"
                            />
                            <FieldError message={errors.address?.county?.message} />
                        </div>
                    </div>
                    {/* Postcode input */}
                    <div>
                        <label htmlFor="address.postcode" className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
                        <input
                            {...register("address.postcode")}
                            className={inputClass(!!errors.address?.postcode)}
                            id="address.postcode"
                            type="text"
                            autoComplete="postal-code"
                        />
                        <FieldError message={errors.address?.postcode?.message} />
                    </div>
                    {/* Reset lookup button */}
                    <button
                        className="text-xs text-slate-500 underline hover:text-slate-800 cursor-pointer"
                        type="button"
                        onClick={resetAddress}
                    >
                        Search again
                    </button>
                </div>
            )}
        </fieldset>
    );
}
