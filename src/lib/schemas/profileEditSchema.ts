import { z } from 'zod';

// Schema for profile form input validation
export const profileFormSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    dateOfBirth: z.string().refine((val) => {
        if (!val) return false;
        const dob = new Date(val);
        if (isNaN(dob.getTime())) return false;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        return age >= 16;
    }, 'You must be at least 16 years old'),
    address: z.object({
        line1: z.string().min(1, 'Address line 1 is required'),
        line2: z.string().optional(),
        townOrCity: z.string().min(1, 'Town or city is required'),
        county: z.string().min(1, 'County is required'),
        postcode: z.string().min(1, 'Postcode is required'),
    }),
});

// Define shape of profile form data
export type ProfileForm = z.infer<typeof profileFormSchema>;
