import { db } from "@/lib/firebase"
import {
    collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, query, where,
} from "firebase/firestore"
import type { PartnerProfile, PartnerRequest } from "@/types/partnerProfile"
import { createNotification } from "@/lib/notifications"

export async function getPartnerProfile(uid: string): Promise<PartnerProfile | null> {
    const snap = await getDoc(doc(db, "partnerProfiles", uid))
    if (!snap.exists()) return null
    return { uid: snap.id, ...snap.data() } as PartnerProfile
}

export async function upsertPartnerProfile(
    uid: string,
    data: Omit<PartnerProfile, "uid" | "updatedAt">,
): Promise<void> {
    await setDoc(
        doc(db, "partnerProfiles", uid),
        { ...data, uid, updatedAt: new Date().toISOString() },
        { merge: true },
    )
}

export async function searchPartnerProfiles(
    excludeUid: string,
    sport?: string,
    skillLevel?: string,
): Promise<PartnerProfile[]> {
    const q = query(collection(db, "partnerProfiles"), where("isVisible", "==", true))
    const snap = await getDocs(q)
    let profiles = snap.docs
        .map(d => ({ uid: d.id, ...d.data() } as PartnerProfile))
        .filter(p => p.uid !== excludeUid)
    if (sport) profiles = profiles.filter(p => p.sport === sport)
    if (skillLevel) profiles = profiles.filter(p => p.skillLevel === skillLevel)
    return profiles
}

export async function sendPartnerRequest(data: {
    senderId: string
    senderName: string
    receiverId: string
    receiverName: string
    sport: string
    message: string
}): Promise<void> {
    const now = new Date().toISOString()
    const ref = await addDoc(collection(db, "partnerRequests"), {
        ...data,
        status: "pending",
        createdAt: now,
        updatedAt: now,
    })
    await createNotification({
        userId: data.receiverId,
        type: "partner_request",
        title: "New Partner Request",
        message: `${data.senderName} wants to play ${data.sport} with you!`,
        relatedId: ref.id,
        relatedType: "partnerRequest",
    })
}

export async function getPartnerRequestsReceived(userId: string): Promise<PartnerRequest[]> {
    const q = query(collection(db, "partnerRequests"), where("receiverId", "==", userId))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as PartnerRequest))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getPartnerRequestsSent(userId: string): Promise<PartnerRequest[]> {
    const q = query(collection(db, "partnerRequests"), where("senderId", "==", userId))
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as PartnerRequest))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function respondToPartnerRequest(
    requestId: string,
    request: PartnerRequest,
    response: "accepted" | "rejected",
): Promise<void> {
    await updateDoc(doc(db, "partnerRequests", requestId), {
        status: response,
        updatedAt: new Date().toISOString(),
    })
    await createNotification({
        userId: request.senderId,
        type: response === "accepted" ? "partner_accepted" : "partner_rejected",
        title: response === "accepted" ? "Partner Request Accepted" : "Partner Request Declined",
        message:
            response === "accepted"
                ? `${request.receiverName} accepted your partner request for ${request.sport}!`
                : `${request.receiverName} declined your partner request for ${request.sport}.`,
        relatedId: requestId,
        relatedType: "partnerRequest",
    })
}
