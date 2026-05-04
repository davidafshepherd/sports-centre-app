/**
 * Maps a Firebase registration error code to a user-friendly error message.
 * @param code Firebase registration error code.
 * @returns User-friendly error message.
 */
export function registerFirebaseError(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'An account with this email address already exists.';
        case 'auth/weak-password':
            return 'Password is too weak. Please choose a stronger password.';
        default:
            return 'Registration failed. Please try again.';
    }
}

/**
 * Maps a Firebase login error code to a user-friendly error message.
 * @param code Firebase login error code.
 * @returns User-friendly error message.
 */
export function loginFirebaseError(code: string): string {
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email address or password.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        default:
            return 'Sign in failed. Please try again.';
    }
}

/**
 * Maps a Firebase Google sign-in error code to a user-friendly error message.
 * @param code Firebase Google sigin-in error code.
 * @returns User-friendly error message.
 */
export function googleSignInFirebaseError(code: string): string {
    switch (code) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return 'Sign in was cancelled.';
        case 'auth/popup-blocked':
            return 'Sign-in popup was blocked by the browser. Please allow popups and try again.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        default:
            return 'Google sign in failed. Please try again.';
    }
}
