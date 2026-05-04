import { z } from "zod";

// Schema for login form input validation
export const loginFormSchema = z.object({
    email: z.email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

// Define shape of login form data
export type LoginForm = z.infer<typeof loginFormSchema>;