'use client';

import { useAuth } from '@/providers/AuthProvider';
import { AlertCircle } from 'lucide-react';

export default function ProfileErrorScreen() {
    const { logout } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
            <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <h1 className="text-xl font-semibold text-slate-900">Profile not found</h1>
                <p className="text-sm text-slate-500 max-w-sm">
                    We could not load your profile. This may be a temporary issue — please sign out and try again.
                </p>
            </div>
            <button
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
                onClick={logout}
            >
                Sign out
            </button>
        </div>
    );
}
