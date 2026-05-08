'use client';

import { Clock } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export default function PendingApprovalScreen() {
    const { logout } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
            <div className="flex flex-col items-center gap-3 text-center">
                <Clock className="w-12 h-12 text-amber-400" />
                <h1 className="text-xl font-semibold text-slate-900">Awaiting approval</h1>
                <p className="text-sm text-slate-500 max-w-sm">
                    Your staff account is pending admin approval. You will be able to access the platform once an admin reviews your account.
                </p>
            </div>
            <button
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                onClick={logout}
            >
                Sign out
            </button>
        </div>
    );
}
