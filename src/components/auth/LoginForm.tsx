'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/providers/AuthProvider';
import { loginFormSchema, LoginForm } from '@/lib/schemas/loginFormSchema';
import { inputClass, FieldError } from '@/lib/utils/formHelpers';
import { loginFirebaseError, googleSignInFirebaseError } from '@/lib/utils/FirebaseErrors';
import { FirebaseError } from 'firebase/app';

// Shape of component's props
interface Props {
    onRegisterClick: () => void;    // Function used to open register modal
}

export default function LoginFormCard({ onRegisterClick }: Props) {
    const [submitError, setSubmitError] = useState<string | null>(null);    // Submission error message
    const [googleError, setGoogleError] = useState<string | null>(null);    // Google sign-in error message
    const { login, loginWithGoogle } = useAuth();                           // Functions used to sign user in

    // Initialise form with Zod validation 
    const form = useForm<LoginForm>({
        resolver: zodResolver(loginFormSchema),
        mode: 'onChange',
    });

    // Handle form submission
    async function onSubmit(data: LoginForm) {
        // Reset form submission error
        setSubmitError(null);
        try {
            // Sign user in
            await login(data);
        } catch (error) {
            // Update submission error message
            const code = error instanceof FirebaseError ? error.code : '';
            setSubmitError(loginFirebaseError(code));
        }
    }

    // Handle Google sign-in
    async function handleGoogleSignIn() {
        // Reset sign-in error
        setGoogleError(null);
        try {
            // Sign user in with Google
            await loginWithGoogle();
        } catch (error) {
            // Update sign-in error message
            const code = error instanceof FirebaseError ? error.code : '';
            setGoogleError(googleSignInFirebaseError(code));
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

                {/* Divider */}
                <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs text-slate-400 font-medium">or</span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Google sign-in error message */}
                {googleError && (
                    <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3">
                        <p className="text-sm text-red-700">{googleError}</p>
                    </div>
                )}

                {/* Google sign-in button */}
                <button
                    className="w-full flex items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    type="button"
                    onClick={handleGoogleSignIn}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </button>
            </div>
        </div>
    );
}
