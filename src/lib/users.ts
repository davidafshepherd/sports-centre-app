import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { MembershipStatus, UserProfile } from '@/types/user';

/**
 * Gets all users with the 'staff' role.
 * @returns List of staff user profiles.
 */
export async function getStaffUsers(): Promise<UserProfile[]> {
    const q = query(collection(db, 'users'), where('role', '==', 'staff'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
}

/**
 * Gets multiple user profiles by ID.
 * @param ids Array of user IDs.
 * @returns List of user profiles for the given IDs.
 */
export async function getUsersByIds(ids: string[]): Promise<UserProfile[]> {
    if (ids.length === 0) return [];
    const snaps = await Promise.all(ids.map(id => getDoc(doc(db, 'users', id))));
    return snaps
        .filter(s => s.exists())
        .map(s => ({ uid: s.id, ...s.data() } as UserProfile));
}

/**
 * Updates the membership status of a user.
 * @param id User's ID.
 * @param status New membership status.
 */
export async function updateUserMembershipStatus(id: string, status: MembershipStatus): Promise<void> {
    await updateDoc(doc(db, 'users', id), { membershipStatus: status });
}

/**
 * Updates editable profile fields for a user.
 * @param id User's ID.
 * @param data Fields to update.
 */
export async function updateUserProfile(
    id: string,
    data: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'dateOfBirth' | 'address'>>,
): Promise<void> {
    await updateDoc(doc(db, 'users', id), data as Record<string, unknown>);
}

/**
 * Deletes a user's Firestore profile.
 * @param id User's ID.
 */
export async function deleteUserProfile(id: string): Promise<void> {
    await deleteDoc(doc(db, 'users', id));
}
