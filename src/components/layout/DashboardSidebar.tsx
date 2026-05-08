'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import {
    LayoutDashboard,
    Building2,
    CalendarDays,
    Dumbbell,
    UserSearch,
    Wrench,
    Users,
    LogOut,
    X,
} from 'lucide-react';

// Navigation item
interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: Array<'member' | 'staff' | 'admin'>;
}

// Navigation items and their role visibility
const NAV_ITEMS: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/facilities', label: 'Facilities', icon: Building2, roles: ['member', 'staff', 'admin'] },
    { href: '/bookings', label: 'Bookings', icon: CalendarDays, roles: ['member', 'staff'] },
    { href: '/partners', label: 'Find Partners', icon: UserSearch, roles: ['member'] },
    { href: '/equipment-reports', label: 'Equipment', icon: Wrench, roles: ['member', 'staff'] },
    { href: '/staff', label: 'Staff', icon: Users, roles: ['admin'] },
];

// Shape of component's props
interface Props {
    open: boolean;          // Whether the sidebar is open
    onClose: () => void;    // Function used to close the sidebar
}

export default function DashboardSidebar({ open, onClose }: Props) {
    // Access authentication context + pathname + current user's role
    const { userProfile, logout } = useAuth();
    const pathname = usePathname();
    const role = userProfile?.role;

    // Filter navigation items to those visible to the current user's role
    const visibleNav = NAV_ITEMS.filter(item => !item.roles || (role && item.roles.includes(role)));

    // Store current user's initials
    const initials = ((userProfile?.firstName?.[0] ?? '') + (userProfile?.lastName?.[0] ?? '')).toUpperCase();

    return (
        <aside
            className={[
                'fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col',
                'transform transition-transform duration-200 ease-in-out',
                'lg:relative lg:translate-x-0',
                open ? 'translate-x-0' : '-translate-x-full',
            ].join(' ')}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white leading-tight tracking-wide">StayActive</p>
                        <p className="text-xs text-slate-400 capitalize leading-tight mt-0.5">{role} portal</p>
                    </div>
                </div>
                <button
                    className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    onClick={onClose}
                    aria-label="Close sidebar"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {visibleNav.map(item => {
                    const Icon = item.icon;
                    const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={[
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-sky-600 text-white'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                            ].join(' ')}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User profile and sign out */}
            <div className="p-3 border-t border-white/10">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate leading-tight">
                            {userProfile?.firstName} {userProfile?.lastName}
                        </p>
                        <p className="text-xs text-slate-400 truncate leading-tight mt-0.5">{userProfile?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 mt-1 text-sm text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                    <LogOut className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
