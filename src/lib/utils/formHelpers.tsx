// Return Tailwind class for a form input, with conditional error styling
export function inputClass(hasError: boolean) {
    return [
        "w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder-slate-400",
        "focus:outline-none focus:ring-2 focus:border-transparent",
        hasError
            ? "border-red-400 focus:ring-red-400"
            : "border-slate-300 focus:ring-slate-400",
    ].join(" ")
}

// Display an input validation error message if present
export function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="mt-1 text-xs text-red-600">{message}</p>
}
