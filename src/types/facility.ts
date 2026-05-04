export type FacilityCategory = 'badminton' | 'football' | 'squash' | 'tennis' | 'gym' | 'swimming';

export interface DayHours {
    open: string;   // 24-hour format (HH:MM)
    close: string;  // 24-hour format (HH:MM)
}

export interface OpeningHours {
    monday: DayHours | null;
    tuesday: DayHours | null;
    wednesday: DayHours | null;
    thursday: DayHours | null;
    friday: DayHours | null;
    saturday: DayHours | null;
    sunday: DayHours | null;
}

export interface Facility {
    id: string;
    name: string;
    category: FacilityCategory;
    description: string;
    usageGuidelines: string[];
    location: string;
    maxCapacity: number;
    openingHours: OpeningHours;
    slotDurationMins: number;
    isActive: boolean;
    assignedStaffIds: string[];
    createdAt: string;  // ISO datetime string (YYYY-MM-DDTHH:mm:ssZ)
    updatedAt: string;  // ISO datetime string (YYYY-MM-DDTHH:mm:ssZ)
}

export const CATEGORY_LABELS: Record<FacilityCategory, string> = {
    badminton: 'Badminton',
    football:  'Football',
    squash:    'Squash',
    tennis:    'Tennis',
    gym:       'Gym',
    swimming:  'Swimming',
};
