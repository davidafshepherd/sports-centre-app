export type UserRole = "member" | "staff" | "admin";

export interface UserProfile {
    uid: string;
    fullName: string;
    dateOfBirth: string;
    address: string;
    email: string;
    role: UserRole;
    createdAt?: unknown;
    updatedAt?: unknown;
}
