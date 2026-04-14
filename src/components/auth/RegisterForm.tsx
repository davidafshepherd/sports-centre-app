"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { X } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { registerFormSchema, RegisterForm } from "../../features/auth/schemas/registerFormSchema";
import PersonalDetailsFieldset from "./fieldsets/PersonalDetailsFieldset";
import AccountDetailsFieldset from "./fieldsets/AccountDetailsFieldset";
import AddressFieldset from "./fieldsets/AddressFieldset";
import { registerFirebaseError } from "../../features/auth/utils/mapFirebaseErrors";

// Shape of component's props
interface Props {
    onClose: () => void;    // Function used to close register modal
}

export default function RegisterFormCard({ onClose }: Props) {
    // Submission error message
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Initialise form with Zod validation 
    const form = useForm<RegisterForm>({
        resolver: zodResolver(registerFormSchema),
        mode: "onChange",
    });

    // Watch password fields in form
    const passwordValue = useWatch({ control: form.control, name: "password" });
    const confirmPasswordValue = useWatch({ control: form.control, name: "confirmPassword" });

    // Password match validation
    const confirmPasswordError =
        confirmPasswordValue && passwordValue !== confirmPasswordValue
            ? "Passwords do not match"
            : form.formState.errors.confirmPassword?.message;

    // Handle form submission
    async function onSubmit(data: RegisterForm) {
        // Reset form submission error
        setSubmitError(null);

        try {
            // Create Firebase Auth user
            const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);

            // Update user's Firebase Auth profile with a display name
            await updateProfile(user, { displayName: `${data.firstName} ${data.lastName}` });

            // Save user's profile to Firestore
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

            // Close register modal
            onClose();
        } catch (error) {
            // Update submission error message
            const code = error instanceof FirebaseError ? error.code : "";
            setSubmitError(registerFirebaseError(code));
        }
    }

    return (
        <div className="w-full max-w-lg">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                {/* Header */}
                <div className="mb-6 text-center relative">
                    {/* Close Button */}
                    <button
                        className="absolute -top-2 -right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    {/* Heading */}
                    <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
                    {/* Switch to login */}
                    <p className="mt-1 text-sm text-slate-500">
                        Already have an account?{" "}
                        <button
                            className="text-slate-500 underline font-medium hover:text-slate-800 cursor-pointer"
                            type="button"
                            onClick={onClose}
                        >
                            Sign in
                        </button>
                    </p>
                </div>

                {/* Register form */}
                <form onSubmit={form.handleSubmit(onSubmit)} method="post" noValidate className="space-y-5">
                    {/* Form sections */}
                    <PersonalDetailsFieldset register={form.register} errors={form.formState.errors} />
                    <AccountDetailsFieldset register={form.register} errors={form.formState.errors} confirmPasswordError={confirmPasswordError} />
                    <AddressFieldset register={form.register} errors={form.formState.errors} setValue={form.setValue} />

                    {/* Submission error message */}
                    {submitError && (
                        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                            <p className="text-sm text-red-700">{submitError}</p>
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:hover:bg-slate-900 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        type="submit"
                        disabled={form.formState.isSubmitting || !form.formState.isValid}
                    >
                        {form.formState.isSubmitting ? "Creating account…" : "Create account"}
                    </button>
                </form>
            </div>
        </div>
    );
}
