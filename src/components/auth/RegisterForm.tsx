"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { auth, db } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const registerSchema = z
    .object({
        firstName: z.string().min(1, "First name is required").max(50),
        lastName: z.string().min(1, "Last name is required").max(50),
        dateOfBirth: z.string().refine((val) => {
            if (!val) return false;
            const dob = new Date(val);
            if (isNaN(dob.getTime())) return false;
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
            return age >= 16;
        }, "You must be at least 16 years old to register"),
        email: z.email("Please enter a valid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[a-z]/, "Must contain a lowercase letter")
            .regex(/[0-9]/, "Must contain a number")
            .regex(/[^A-Za-z0-9]/, "Must contain a symbol"),
        confirmPassword: 
        z.string().min(1, "Passwords do not match"),
        address: z.object({
            line1: z.string().min(1, "Address line 1 is required"),
            line2: z.string(),
            townOrCity: z.string().min(1, "Town or city is required"),
            county: z.string().min(1, "County is required"),
            postcode: z.string().min(1, "Postcode is required"),
        }),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// IdealPostcodes postcode lookup response
// ---------------------------------------------------------------------------

interface AddressResult {
    line_1: string;
    line_2: string;
    line_3: string;
    post_town: string;
    county: string;
    postcode: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firebaseErrorMessage(code: string): string {
    switch (code) {
        case "auth/email-already-in-use":
            return "An account with this email address already exists.";
        case "auth/weak-password":
            return "Password is too weak. Please choose a stronger password.";
        default:
            return "Registration failed. Please try again.";
    }
}

function inputClass(hasError: boolean) {
    return [
        "w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder-slate-400",
        "focus:outline-none focus:ring-2 focus:border-transparent",
        hasError
            ? "border-red-400 focus:ring-red-400"
            : "border-slate-300 focus:ring-slate-400",
    ].join(" ");
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1">
            {children}
        </label>
    );
}

// ---------------------------------------------------------------------------
// Address step type
// ---------------------------------------------------------------------------

type AddressStep = "postcode" | "select" | "fields";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RegisterFormProps {
    onSuccess?: () => void;
    onClose?: () => void;
}

export default function RegisterForm({ onSuccess, onClose }: RegisterFormProps = {}) {
    const router = useRouter();
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Address lookup state
    const [addressStep, setAddressStep] = useState<AddressStep>("postcode");
    const [postcodeInput, setPostcodeInput] = useState("");
    const [addresses, setAddresses] = useState<AddressResult[]>([]);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting, isValid },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
    });

    const passwordValue = watch("password");
    const confirmPasswordValue = watch("confirmPassword");
    const confirmPasswordError =
        confirmPasswordValue && passwordValue !== confirmPasswordValue
            ? "Passwords do not match"
            : errors.confirmPassword?.message;

    // -----------------------------------------------------------------------
    // Address lookup
    // -----------------------------------------------------------------------

    async function handleFindAddress() {
        if (!postcodeInput.trim()) {
            setLookupError("Please enter a postcode.");
            return;
        }
        setLookupLoading(true);
        setLookupError(null);
        try {
            const res = await fetch(
                `/api/postcode-lookup?postcode=${encodeURIComponent(postcodeInput.trim())}`
            );
            const data = await res.json();

            if (!res.ok || !data.result || data.result.length === 0) {
                setLookupError("No addresses found. Please check the postcode or enter your address manually.");
                return;
            }

            setAddresses(data.result);
            setAddressStep("select");
        } catch {
            setLookupError("Address lookup failed. Please try again or enter your address manually.");
        } finally {
            setLookupLoading(false);
        }
    }

    function handleAddressSelect(index: number) {
        const addr = addresses[index];
        if (!addr) return;
        const line2 = [addr.line_2, addr.line_3].filter(Boolean).join(", ");
        setValue("address.line1", addr.line_1, { shouldValidate: true });
        setValue("address.line2", line2, { shouldValidate: true });
        setValue("address.townOrCity", addr.post_town, { shouldValidate: true });
        setValue("address.county", addr.county, { shouldValidate: true });
        setValue("address.postcode", addr.postcode, { shouldValidate: true });
        setAddressStep("fields");
    }

    function resetAddress() {
        setPostcodeInput("");
        setAddresses([]);
        setLookupError(null);
        setAddressStep("postcode");
        setValue("address.line1", "");
        setValue("address.line2", "");
        setValue("address.townOrCity", "");
        setValue("address.county", "");
        setValue("address.postcode", "");
    }

    // -----------------------------------------------------------------------
    // Form submission
    // -----------------------------------------------------------------------

    async function onSubmit(data: RegisterFormData) {
        setSubmitError(null);
        try {
            const { user } = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );
            await updateProfile(user, {
                displayName: `${data.firstName} ${data.lastName}`,
            });
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                dateOfBirth: data.dateOfBirth,
                address: data.address,
                role: "member",
                membershipStatus: "active",
                createdAt: new Date().toISOString(),
            });
            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/");
            }
        } catch (err: unknown) {
            const code =
                err instanceof Error && "code" in err
                    ? (err as { code: string }).code
                    : "";
            setSubmitError(firebaseErrorMessage(code));
        }
    }

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="w-full max-w-lg">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <div className="mb-6 text-center relative">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute -top-2 -right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Already have an account?{" "}
                        {onClose ? (
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-slate-500 underline font-medium hover:text-slate-800 cursor-pointer"
                            >
                                Sign in
                            </button>
                        ) : (
                            <Link href="/login" className="text-slate-900 hover:underline font-medium">
                                Sign in
                            </Link>
                        )}
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} method="post" noValidate className="space-y-5">
                    {/* Personal details */}
                    <fieldset>
                        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                            Personal details
                        </legend>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <Label htmlFor="firstName">First name</Label>
                                <input
                                    id="firstName"
                                    type="text"
                                    autoComplete="given-name"
                                    className={inputClass(!!errors.firstName)}
                                    {...register("firstName")}
                                />
                                <FieldError message={errors.firstName?.message} />
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last name</Label>
                                <input
                                    id="lastName"
                                    type="text"
                                    autoComplete="family-name"
                                    className={inputClass(!!errors.lastName)}
                                    {...register("lastName")}
                                />
                                <FieldError message={errors.lastName?.message} />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="dateOfBirth">Date of birth</Label>
                            <input
                                id="dateOfBirth"
                                type="date"
                                className={inputClass(!!errors.dateOfBirth)}
                                {...register("dateOfBirth")}
                            />
                            <FieldError message={errors.dateOfBirth?.message} />
                        </div>
                    </fieldset>

                    {/* Account details */}
                    <fieldset>
                        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                            Account details
                        </legend>
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="email">Email address</Label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    className={inputClass(!!errors.email)}
                                    {...register("email")}
                                />
                                <FieldError message={errors.email?.message} />
                            </div>
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    className={inputClass(!!errors.password)}
                                    {...register("password")}
                                />
                                <FieldError message={errors.password?.message} />
                            </div>
                            <div>
                                <Label htmlFor="confirmPassword">Confirm password</Label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    className={inputClass(!!confirmPasswordError)}
                                    {...register("confirmPassword")}
                                />
                                <FieldError message={confirmPasswordError} />
                            </div>
                        </div>
                    </fieldset>

                    {/* Address */}
                    <fieldset>
                        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                            Your address
                        </legend>

                        {/* Step 1: postcode entry */}
                        {addressStep === "postcode" && (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor="postcodeInput">Postcode</Label>
                                        <input
                                            id="postcodeInput"
                                            type="text"
                                            placeholder="e.g. SW1A 2AA"
                                            value={postcodeInput}
                                            onChange={(e) => {
                                                setPostcodeInput(e.target.value);
                                                setLookupError(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleFindAddress();
                                                }
                                            }}
                                            className={inputClass(!!lookupError)}
                                            autoComplete="postal-code"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={handleFindAddress}
                                            disabled={lookupLoading}
                                            className="px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:hover:bg-slate-800 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                                        >
                                            {lookupLoading ? "Searching…" : "Find my address"}
                                        </button>
                                    </div>
                                </div>
                                {lookupError && (
                                    <p className="text-xs text-red-600">{lookupError}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setAddressStep("fields")}
                                    className="text-xs text-slate-500 underline hover:text-slate-800 cursor-pointer"
                                >
                                    Enter address manually
                                </button>
                            </div>
                        )}

                        {/* Step 2: address selection dropdown */}
                        {addressStep === "select" && (
                            <div className="space-y-2">
                                <Label htmlFor="addressSelect">
                                    {addresses.length} address{addresses.length !== 1 ? "es" : ""} found
                                </Label>
                                <select
                                    id="addressSelect"
                                    defaultValue=""
                                    onChange={(e) => handleAddressSelect(Number(e.target.value))}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                                >
                                    <option value="" disabled>Select your address</option>
                                    {addresses.map((addr, i) => (
                                        <option key={i} value={i}>
                                            {[addr.line_1, addr.line_2, addr.line_3]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={resetAddress}
                                        className="text-xs text-slate-500 underline hover:text-slate-800 cursor-pointer"
                                    >
                                        Change postcode
                                    </button>
                                    <span className="text-xs text-slate-300">|</span>
                                    <button
                                        type="button"
                                        onClick={() => setAddressStep("fields")}
                                        className="text-xs text-slate-500 underline hover:text-slate-800 cursor-pointer"
                                    >
                                        Enter address manually
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: editable address fields */}
                        {addressStep === "fields" && (
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="address.line1">Address line 1</Label>
                                    <input
                                        id="address.line1"
                                        type="text"
                                        autoComplete="address-line1"
                                        className={inputClass(!!errors.address?.line1)}
                                        {...register("address.line1")}
                                    />
                                    <FieldError message={errors.address?.line1?.message} />
                                </div>
                                <div>
                                    <Label htmlFor="address.line2">
                                        Address line 2{" "}
                                        <span className="font-normal text-slate-400">(optional)</span>
                                    </Label>
                                    <input
                                        id="address.line2"
                                        type="text"
                                        autoComplete="address-line2"
                                        className={inputClass(false)}
                                        {...register("address.line2")}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="address.townOrCity">Town or city</Label>
                                        <input
                                            id="address.townOrCity"
                                            type="text"
                                            autoComplete="address-level2"
                                            className={inputClass(!!errors.address?.townOrCity)}
                                            {...register("address.townOrCity")}
                                        />
                                        <FieldError message={errors.address?.townOrCity?.message} />
                                    </div>
                                    <div>
                                        <Label htmlFor="address.county">County</Label>
                                        <input
                                            id="address.county"
                                            type="text"
                                            className={inputClass(!!errors.address?.county)}
                                            {...register("address.county")}
                                        />
                                        <FieldError message={errors.address?.county?.message} />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="address.postcode">Postcode</Label>
                                    <input
                                        id="address.postcode"
                                        type="text"
                                        autoComplete="postal-code"
                                        className={inputClass(!!errors.address?.postcode)}
                                        {...register("address.postcode")}
                                    />
                                    <FieldError message={errors.address?.postcode?.message} />
                                </div>
                                <button
                                    type="button"
                                    onClick={resetAddress}
                                    className="text-xs text-slate-500 underline hover:text-slate-800 cursor-pointer"
                                >
                                    Search again
                                </button>
                            </div>
                        )}
                    </fieldset>

                    {submitError && (
                        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                            <p className="text-sm text-red-700">{submitError}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || !isValid}
                        className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:hover:bg-slate-900 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Creating account…" : "Create account"}
                    </button>
                </form>
            </div>
        </div>
    );
}
