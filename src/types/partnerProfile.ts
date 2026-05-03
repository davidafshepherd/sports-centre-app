export type SkillLevel = "beginner" | "intermediate" | "advanced"

export interface PartnerProfile {
    uid: string
    displayName: string
    sport: string
    skillLevel: SkillLevel
    availability: string[]  // e.g. ["monday_morning", "saturday_afternoon"]
    bio: string
    isVisible: boolean
    updatedAt: string
}

export interface PartnerRequest {
    id: string
    senderId: string
    senderName: string
    receiverId: string
    receiverName: string
    sport: string
    message: string
    status: "pending" | "accepted" | "rejected"
    createdAt: string
    updatedAt: string
}

export const SPORTS = [
    "Badminton",
    "Football",
    "Squash",
    "Tennis",
    "Swimming",
    "Basketball",
    "Cricket",
    "Running",
    "Yoga",
] as const

export const AVAILABILITY_OPTIONS = [
    { value: "monday_morning",    label: "Mon morning" },
    { value: "monday_afternoon",  label: "Mon afternoon" },
    { value: "monday_evening",    label: "Mon evening" },
    { value: "tuesday_morning",   label: "Tue morning" },
    { value: "tuesday_afternoon", label: "Tue afternoon" },
    { value: "tuesday_evening",   label: "Tue evening" },
    { value: "wednesday_morning", label: "Wed morning" },
    { value: "wednesday_afternoon", label: "Wed afternoon" },
    { value: "wednesday_evening", label: "Wed evening" },
    { value: "thursday_morning",  label: "Thu morning" },
    { value: "thursday_afternoon", label: "Thu afternoon" },
    { value: "thursday_evening",  label: "Thu evening" },
    { value: "friday_morning",    label: "Fri morning" },
    { value: "friday_afternoon",  label: "Fri afternoon" },
    { value: "friday_evening",    label: "Fri evening" },
    { value: "saturday_morning",  label: "Sat morning" },
    { value: "saturday_afternoon", label: "Sat afternoon" },
    { value: "saturday_evening",  label: "Sat evening" },
    { value: "sunday_morning",    label: "Sun morning" },
    { value: "sunday_afternoon",  label: "Sun afternoon" },
    { value: "sunday_evening",    label: "Sun evening" },
]
