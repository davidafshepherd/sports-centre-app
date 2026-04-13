export type UserRole = "member" | "staff" | "admin";
export type MembershipStatus = "active" | "suspended" | "cancelled";

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
    dateOfBirth: string; // ISO date string (YYYY-MM-DD)
    address: Address;
    role: UserRole;
    membershipStatus: MembershipStatus;
    createdAt: string; // ISO date string (YYYY-MM-DD)
}
