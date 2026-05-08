import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    arrayUnion,
    arrayRemove,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Facility } from '@/types/facility';

/**
 * Gets all facilities, including inactive facilities.
 * @returns List of facilities sorted by name.
 */
export async function getFacilities(): Promise<Facility[]> {
    // Fetch all facilities from Firestore
    const snap = await getDocs(collection(db, 'facilities'));

    // Convert Firestore documents into Facility objects
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Facility))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Gets all active facilities.
 * @returns List of active facilities sorted by name.
 */
export async function getActiveFacilities(): Promise<Facility[]> {
    // Fetch all active facilities from Firestore
    const q = query(collection(db, 'facilities'), where('isActive', '==', true));
    const snap = await getDocs(q);

    // Convert Firestore documents into Facility objects
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Facility))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Gets a facility by ID.
 * @param id Facility's ID.
 * @returns Facility if found, otherwise null.
 */
export async function getFacilityById(id: string): Promise<Facility | null> {
    // Fetch the facility from Firestore
    const snap = await getDoc(doc(db, 'facilities', id));

    // Return null if not found
    if (!snap.exists()) return null;

    // Convert Firestore document into a Facility object
    return { id: snap.id, ...snap.data() } as Facility;
}

/**
 * Gets all facilities assigned to a staff member.
 * @param staffId Staff member ID.
 * @returns List of facilities assigned to the staff member.
 */
export async function getFacilitiesForStaff(staffId: string): Promise<Facility[]> {
    // Fetch all facilities assigned to the staff member from Firestore
    const q = query(
        collection(db, 'facilities'), 
        where('assignedStaffIds', 'array-contains', staffId),
    );
    const snap = await getDocs(q);

    // Convert Firestore documents into Facility objects
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Facility));
}

/**
 * Creates a new facility.
 * @param data Facility's fields, excluding auto-generated fields.
 * @returns Created facility's ID.
 */
export async function createFacility(
    data: Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
    // Create ISO datetime string for audit fields
    const now = new Date().toISOString();

    // Add new facility document to Firestore
    const ref = await addDoc(collection(db, 'facilities'), {
        ...data,
        createdAt: now,
        updatedAt: now,
    });

    // Return the facility's ID
    return ref.id;
}

/**
 * Updates a facility.
 * @param id Facility's ID.
 * @param data Facility's fields to update.
 */
export async function updateFacility(
    id: string,
    data: Partial<Omit<Facility, 'id' | 'createdAt'>>,
): Promise<void> {
    await updateDoc(doc(db, 'facilities', id), {
        ...data,
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Updates whether a facility is active.
 * @param id Facility's ID.
 * @param isActive Whether the facility should be active.
 */
export async function setFacilityActive(id: string, isActive: boolean): Promise<void> {
    await updateDoc(doc(db, 'facilities', id), {
        isActive,
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Assigns a staff member to a facility.
 * @param facilityId Facility's ID.
 * @param staffId Staff member's ID.
 */
export async function assignStaffToFacility(facilityId: string, staffId: string): Promise<void> {
    await updateDoc(doc(db, 'facilities', facilityId), {
        assignedStaffIds: arrayUnion(staffId),
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Removes a staff member from a facility.
 * @param facilityId Facility's ID.
 * @param staffId Staff member's ID.
 */
export async function removeStaffFromFacility(facilityId: string, staffId: string): Promise<void> {
    await updateDoc(doc(db, 'facilities', facilityId), {
        assignedStaffIds: arrayRemove(staffId),
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Deletes a facility.
 * @param id Facility's ID.
 */
export async function deleteFacility(id: string): Promise<void> {
    await deleteDoc(doc(db, 'facilities', id));
}
