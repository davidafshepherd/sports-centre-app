'use client';

import { useEffect, useState } from 'react';
import { Dumbbell, Check } from 'lucide-react';
import LoginFormCard from '@/components/auth/LoginForm';
import RegisterFormCard from '@/components/auth/RegisterForm';

// Feature list displayed in left panel
const features = [
    'Book courts, pitches and more',
    'Track your booking history',
    'Find activity partners',
];

export default function HomeView() {
    // Register modal visibility
    const [showRegister, setShowRegister] = useState(false);

    // Disable page scrolling when register modal is visible
    useEffect(() => {
        document.body.style.overflow = showRegister ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [showRegister]);

    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding (desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col items-center justify-center px-10 py-16 text-white">
                {/* Logo icon */}
                <div className="w-28 h-28 bg-white/10 rounded-3xl flex items-center justify-center mb-10">
                    <Dumbbell className="w-16 h-16 text-white" />
                </div>
                {/* App name and tagline */}
                <h1 className="text-6xl font-bold tracking-tight">StayActive</h1>
                <p className="mt-5 text-xl text-slate-400 text-center leading-relaxed">
                    Your sports centre, managed simply.
                </p>
                {/* Feature list */}
                <ul className="mt-14 space-y-5">
                    {features.map((f) => (
                        <li key={f} className="flex items-center gap-4 text-slate-300 text-lg">
                            <Check className="w-5 h-5 text-slate-400 shrink-0" />
                            <span>{f}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right panel — login */}
            <div className="flex-1 bg-white flex flex-col items-center justify-center px-6 py-12">
                {/* Mobile logo (shown on small screens) */}
                <div className="lg:hidden flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-3">
                        <Dumbbell className="w-9 h-9 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">StayActive</h1>
                </div>
                {/* Login form */} 
                <LoginFormCard onRegisterClick={() => setShowRegister(true)} />
            </div>

            {/* Register modal */}
            {showRegister && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
                    <div
                        className="flex min-h-full items-center justify-center p-4 py-8"
                        onClick={(e) => {
                             // Close register modal when clicking outside the form
                            if (e.target === e.currentTarget) setShowRegister(false);
                        }}
                    >
                        {/* Register form */} 
                        <RegisterFormCard onClose={() => setShowRegister(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}
