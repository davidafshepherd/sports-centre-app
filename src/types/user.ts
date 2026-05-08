export type UserRole = 'member' | 'staff' | 'admin';
export type MembershipStatus = 'active' | 'pending' | 'suspended' | 'cancelled';

export interface Address {
    line1: string;
    line2?: string;
    townOrCity: string;
    county: string;
    postcode: string;
}

export interface UserProfile {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;    // ISO date string (YYYY-MM-DD)
    address: Address;
    role: UserRole;
    membershipStatus: MembershipStatus;
    createdAt: string;      // ISO date string (YYYY-MM-DD)
}

export const STATUS_FILTERS: { label: string; value: MembershipStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
];

export const STATUS_BADGE: Partial<Record<MembershipStatus, string>> = {
    active: 'bg-emerald-500 text-white',
    pending: 'bg-sky-500 text-white',
    suspended: 'bg-amber-500 text-white',
};
