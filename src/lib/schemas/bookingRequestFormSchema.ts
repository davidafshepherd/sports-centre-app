import { z } from 'zod'

// Schema for booking request form input validation
export const bookingRequestFormSchema = z.object({
    activityDescription: z.string().min(3, "Please describe your activity"),
})

// Define shape of booking request form data
export type BookingRequestForm = z.infer<typeof bookingRequestFormSchema>
