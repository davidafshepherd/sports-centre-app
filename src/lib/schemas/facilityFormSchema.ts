import { z } from 'zod';

import { DAY_LABELS, WEEK_DAYS } from '@/lib/utils/openingHours';

// Schema for opening hours of a single day
const dayHoursSchema = z.object({
    open: z.string(),
    close: z.string(),
}).nullable();

// Schema for facility form input validation
export const facilityFormSchema = z.object({
    name: z.string().trim().min(1, 'Name is required.'),
    category: z.enum(['badminton', 'basketball', 'cricket', 'football', 'gym', 'squash', 'swimming', 'tennis', 'yoga']),
    description: z.string().trim().min(1, 'Description is required.'),
    location: z.string().trim().min(1, 'Location is required.'),
    maxCapacity: z.number().int().min(1, 'Capacity must be at least 1.'),
    slotDurationMins: z.number().int(),
    openingHours: z.object({
        monday: dayHoursSchema,
        tuesday: dayHoursSchema,
        wednesday: dayHoursSchema,
        thursday: dayHoursSchema,
        friday: dayHoursSchema,
        saturday: dayHoursSchema,
        sunday: dayHoursSchema,
    }),
    usageGuidelines: z.array(z.string().trim()).transform(gs => gs.filter(Boolean)),
    isActive: z.boolean(),
    assignedStaffIds: z.array(z.string()),
}).superRefine((data, ctx) => {
    for (const day of WEEK_DAYS) {
        const h = data.openingHours[day];
        if (h && h.open >= h.close) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${DAY_LABELS[day]}: opening time must be before closing time.`,
                path: ['openingHours', day],
            });
        }
    }
});

// Define shape of facility form data
export type FacilityForm = z.infer<typeof facilityFormSchema>;
