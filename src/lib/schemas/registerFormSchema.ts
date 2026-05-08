import { z } from 'zod';

// Schema for register form input validation
export const registerFormSchema = z
    .object({
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
        }, 'You must be at least 16 years old to register'),
        email: z.email('Please enter a valid email address'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Must contain an uppercase letter')
            .regex(/[a-z]/, 'Must contain a lowercase letter')
            .regex(/[0-9]/, 'Must contain a number')
            .regex(/[^A-Za-z0-9]/, 'Must contain a symbol'),
        confirmPassword: z.string().min(1, 'Passwords do not match'),
        address: z.object({
            line1: z.string().min(1, 'Address line 1 is required'),
            line2: z.string(),
            townOrCity: z.string().min(1, 'Town or city is required'),
            county: z.string().min(1, 'County is required'),
            postcode: z.string().min(1, 'Postcode is required'),
        }),
        role: z.enum(['member', 'staff']),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

// Define shape of register form data
export type RegisterForm = z.infer<typeof registerFormSchema>;
