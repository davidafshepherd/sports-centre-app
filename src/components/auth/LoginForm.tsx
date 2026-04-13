"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
    email: z.email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firebaseErrorMessage(code: string): string {
    switch (code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
            return "Invalid email address or password.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later.";
        default:
            return "Sign in failed. Please try again.";
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface LoginFormProps {
    onRegisterClick?: () => void;
}

export default function LoginForm({ onRegisterClick }: LoginFormProps = {}) {
    const router = useRouter();
    const { login } = useAuth();
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isValid },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
    });

    async function onSubmit(data: LoginFormData) {
        setSubmitError(null);
        try {
            await login(data.email, data.password);
            router.push("/");
        } catch (err: unknown) {
            const code =
                err instanceof Error && "code" in err
                    ? (err as { code: string }).code
                    : "";
            setSubmitError(firebaseErrorMessage(code));
        }
    }

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                {/* Header */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Don&apos;t have an account?{" "}
                        {onRegisterClick ? (
                            <button
                                type="button"
                                onClick={onRegisterClick}
                                className="text-slate-500 underline font-medium hover:text-slate-800 cursor-pointer"
                            >
                                Register
                            </button>
                        ) : (
                            <Link
                                href="/register"
                                className="text-slate-500 underline font-medium hover:text-slate-800"
                            >
                                Register
                            </Link>
                        )}
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} method="post" noValidate className="space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            className={inputClass(!!errors.email)}
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            className={inputClass(!!errors.password)}
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                        )}
                    </div>

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
                        {isSubmitting ? "Signing in…" : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
