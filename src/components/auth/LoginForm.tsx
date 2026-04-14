"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { loginFormSchema, LoginForm } from "../../features/auth/schemas/loginFormSchema";
import { inputClass, FieldError } from "./formHelpers";
import { loginFirebaseError } from "../../features/auth/utils/mapFirebaseErrors";
import { FirebaseError } from "firebase/app";

// Shape of component's props
interface Props {
    onRegisterClick: () => void;    // Function used to open register modal
}

export default function LoginFormCard({ onRegisterClick }: Props) {
    const [submitError, setSubmitError] = useState<string | null>(null);    // Submission error message
    const { login } = useAuth();                                            // Function used to sign user in

    // Initialise form with Zod validation 
    const form = useForm<LoginForm>({
        resolver: zodResolver(loginFormSchema),
        mode: "onChange",
    });

    // Handle form submission
    async function onSubmit(data: LoginForm) {
        // Reset form submission error
        setSubmitError(null);
        try {
            // Sign user in
            await login(data.email, data.password);
        } catch (error) {
            // Update submission error message
            const code = error instanceof FirebaseError ? error.code : "";
            setSubmitError(loginFirebaseError(code));
        }
    }

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                {/* Header */}
                <div className="mb-6 text-center">
                    {/* Heading */}
                    <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
                    {/* Switch to register */}
                    <p className="mt-1 text-sm text-slate-500">
                        Don&apos;t have an account?{" "}
                        <button
                            className="text-slate-500 underline font-medium hover:text-slate-800 cursor-pointer"
                            type="button"
                            onClick={onRegisterClick}
                        >
                            Register
                        </button>
                    </p>
                </div>

                {/* Login form */}
                <form onSubmit={form.handleSubmit(onSubmit)} method="post" noValidate className="space-y-4">
                {/* Email input */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                            Email address
                        </label>
                        <input
                            {...form.register("email")}
                            className={inputClass(!!form.formState.errors.email)}
                            id="email"
                            type="email"
                            autoComplete="email"
                        />
                        <FieldError message={form.formState.errors.email?.message} />
                    </div>
                    {/* Password input */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                            Password
                        </label>
                        <input
                            {...form.register("password")}
                            className={inputClass(!!form.formState.errors.password)}
                            id="password"
                            type="password"
                            autoComplete="current-password"
                        />
                        <FieldError message={form.formState.errors.password?.message} />
                    </div>

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
                        {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
