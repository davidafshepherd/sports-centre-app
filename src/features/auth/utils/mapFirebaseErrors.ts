// Map Firebase registration error codes to user-friendly messages
export function registerFirebaseError(code: string): string {
    switch (code) {
        case "auth/email-already-in-use":
            return "An account with this email address already exists.";
        case "auth/weak-password":
            return "Password is too weak. Please choose a stronger password.";
        default:
            return "Registration failed. Please try again.";
    }
}

// Map Firebase login error codes to user-friendly messages
export function loginFirebaseError(code: string): string {
    switch (code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
            return "Invalid email address or password.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later.";
        default:
            return "Sign in failed. Please try again.";
    }
}
