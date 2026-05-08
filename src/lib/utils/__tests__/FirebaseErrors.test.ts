import {
    registerFirebaseError,
    loginFirebaseError,
    googleSignInFirebaseError,
} from '../FirebaseErrors';

// ─── registerFirebaseError ────────────────────────────────────────────────────

describe('registerFirebaseError', () => {
    test('maps auth/email-already-in-use', () => {
        expect(registerFirebaseError('auth/email-already-in-use'))
            .toBe('An account with this email address already exists.');
    });

    test('maps auth/weak-password', () => {
        expect(registerFirebaseError('auth/weak-password'))
            .toBe('Password is too weak. Please choose a stronger password.');
    });

    test('returns a generic message for unknown codes', () => {
        expect(registerFirebaseError('auth/unknown')).toBe('Registration failed. Please try again.');
        expect(registerFirebaseError('')).toBe('Registration failed. Please try again.');
        expect(registerFirebaseError('network-error')).toBe('Registration failed. Please try again.');
    });
});

// ─── loginFirebaseError ───────────────────────────────────────────────────────

describe('loginFirebaseError', () => {
    test('maps auth/invalid-credential to the wrong-credentials message', () => {
        expect(loginFirebaseError('auth/invalid-credential'))
            .toBe('Invalid email address or password.');
    });

    test('maps auth/user-not-found to the wrong-credentials message', () => {
        expect(loginFirebaseError('auth/user-not-found'))
            .toBe('Invalid email address or password.');
    });

    test('maps auth/wrong-password to the wrong-credentials message', () => {
        expect(loginFirebaseError('auth/wrong-password'))
            .toBe('Invalid email address or password.');
    });

    test('maps auth/too-many-requests', () => {
        expect(loginFirebaseError('auth/too-many-requests'))
            .toBe('Too many failed attempts. Please try again later.');
    });

    test('returns a generic message for unknown codes', () => {
        expect(loginFirebaseError('auth/unknown')).toBe('Sign in failed. Please try again.');
        expect(loginFirebaseError('')).toBe('Sign in failed. Please try again.');
    });
});

// ─── googleSignInFirebaseError ────────────────────────────────────────────────

describe('googleSignInFirebaseError', () => {
    test('maps auth/popup-closed-by-user to the cancelled message', () => {
        expect(googleSignInFirebaseError('auth/popup-closed-by-user'))
            .toBe('Sign in was cancelled.');
    });

    test('maps auth/cancelled-popup-request to the cancelled message', () => {
        expect(googleSignInFirebaseError('auth/cancelled-popup-request'))
            .toBe('Sign in was cancelled.');
    });

    test('maps auth/popup-blocked', () => {
        expect(googleSignInFirebaseError('auth/popup-blocked'))
            .toBe('Sign-in popup was blocked by the browser. Please allow popups and try again.');
    });

    test('maps auth/too-many-requests', () => {
        expect(googleSignInFirebaseError('auth/too-many-requests'))
            .toBe('Too many attempts. Please try again later.');
    });

    test('returns a generic message for unknown codes', () => {
        expect(googleSignInFirebaseError('auth/unknown')).toBe('Google sign in failed. Please try again.');
        expect(googleSignInFirebaseError('')).toBe('Google sign in failed. Please try again.');
    });
});
