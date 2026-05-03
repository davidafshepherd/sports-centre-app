export type FacilityCategory = 'badminton' | 'football' | 'squash' | 'tennis' | 'gym' | 'swimming'

export const FACILITY_CATEGORIES: FacilityCategory[] = [
    'badminton', 'football', 'squash', 'tennis', 'gym', 'swimming',
]

export const CATEGORY_LABELS: Record<FacilityCategory, string> = {
    badminton: 'Badminton',
    football:  'Football',
    squash:    'Squash',
    tennis:    'Tennis',
    gym:       'Gym',
    swimming:  'Swimming',
}

export interface DayHours {
    open: string   // "HH:MM" 24-hour format
    close: string  // "HH:MM" 24-hour format
}

export interface Facility {
    id: string
    name: string
    category: FacilityCategory
    description: string
    usageGuidelines: string[]
    location: string
    maxCapacity: number
    openingHours: {
        monday:    DayHours | null
        tuesday:   DayHours | null
        wednesday: DayHours | null
        thursday:  DayHours | null
        friday:    DayHours | null
        saturday:  DayHours | null
        sunday:    DayHours | null
    }
    slotDurationMins: number
    isActive: boolean
    assignedStaffIds: string[]
    createdAt: string
    updatedAt: string
}
