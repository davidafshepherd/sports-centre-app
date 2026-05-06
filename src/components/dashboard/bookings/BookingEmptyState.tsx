import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Shape of BookingEmptyState's props
interface EmptyStateProps {
    icon: React.ReactNode;
    message: string;
    action?: { label: string; href: string };
}

export function BookingEmptyState({ icon, message, action }: EmptyStateProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 flex flex-col items-center gap-3 text-center px-6">
            {/* Icon + message */}
            {icon}
            <p className="text-sm font-medium text-slate-500">{message}</p>
            {/* Action link */}
            {action && (
                <Link 
                    className="inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors cursor-pointer"
                    href={action.href}
                >
                    {action.label} <ArrowRight className="w-4 h-4" />
                </Link>
            )}
        </div>
    );
}

export function BookingLoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Skeleton cards */}
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex">
                    <div className="w-48 bg-slate-100 self-stretch shrink-0" />
                    <div className="flex-1 p-4 space-y-2.5">
                        <div className="h-4 w-2/3 bg-slate-100 rounded-full" />
                        <div className="h-3 w-1/3 bg-slate-100 rounded-full" />
                        <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
