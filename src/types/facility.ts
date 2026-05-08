import {
    Activity,
    Disc2,
    Dumbbell,
    Layers,
    Leaf,
    Medal,
    Target,
    Trophy,
    Waves,
    type LucideIcon,
} from 'lucide-react';

export type FacilityCategory = 'badminton' | 'basketball' | 'cricket' | 'football' | 'gym' | 'squash' | 'swimming' | 'tennis' | 'yoga';

export interface FacilityCategoryConfig {
    icon: LucideIcon;
    bg: string;
    text: string;
    lightBg: string;
    ring: string;
    image: string;
}

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
    basketball: 'Basketball',
    cricket: 'Cricket',
    football: 'Football',
    gym: 'Gym',
    squash: 'Squash',
    swimming: 'Swimming',
    tennis: 'Tennis',
    yoga: 'Yoga',
};

export const CATEGORY_CONFIG: Record<FacilityCategory, FacilityCategoryConfig> = {
    badminton:  { icon: Activity, bg: 'bg-rose-500', text: 'text-rose-600', lightBg: 'bg-rose-50', ring: 'ring-rose-200', image: '/facilities/badminton.jpg' },
    basketball: { icon: Disc2, bg: 'bg-amber-500', text: 'text-amber-600', lightBg: 'bg-amber-50', ring: 'ring-amber-200', image: '/facilities/basketball.jpg' },
    cricket: { icon: Medal, bg: 'bg-lime-600', text: 'text-lime-700', lightBg: 'bg-lime-50', ring: 'ring-lime-200', image: '/facilities/cricket.jpg' },
    football: { icon: Trophy, bg: 'bg-emerald-500', text: 'text-emerald-600', lightBg: 'bg-emerald-50', ring: 'ring-emerald-200', image: '/facilities/football.jpg' },
    gym: { icon: Dumbbell, bg: 'bg-violet-500', text: 'text-violet-600', lightBg: 'bg-violet-50', ring: 'ring-violet-200', image: '/facilities/gym.jpg' },
    squash: { icon: Layers, bg: 'bg-orange-500', text: 'text-orange-600', lightBg: 'bg-orange-50', ring: 'ring-orange-200', image: '/facilities/squash.jpg' },
    swimming: { icon: Waves, bg: 'bg-cyan-500', text: 'text-cyan-600', lightBg: 'bg-cyan-50', ring: 'ring-cyan-200', image: '/facilities/swimming.jpg' },
    tennis: { icon: Target, bg: 'bg-yellow-500', text: 'text-yellow-700', lightBg: 'bg-yellow-50', ring: 'ring-yellow-200', image: '/facilities/tennis.jpg' },
    yoga: { icon: Leaf, bg: 'bg-teal-500', text: 'text-teal-600', lightBg: 'bg-teal-50', ring: 'ring-teal-200', image: '/facilities/yoga.jpg' },
};
