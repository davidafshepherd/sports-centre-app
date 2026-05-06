'use client';

import { createContext, useContext,  useEffect, useState } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { auth, db } from '@/lib/firebase';
import { LoginForm } from '@/lib/schemas/loginFormSchema';
import { RegisterForm } from '@/lib/schemas/registerFormSchema';
import { UserProfile } from '@/types/user';

// Define shape of authentication context
interface AuthContextValue {
    user: User | null;                                  // Firebase Auth user
    userProfile: UserProfile | null;                    // User's Firestore profile
    isRegistering: boolean;                             // Whether a user is currently being registered
    register: (data: RegisterForm) => Promise<void>;    // Function used to register a new user
    login: (data: LoginForm) => Promise<void>;          // Function used to sign a user in with email and password
    loginWithGoogle: () => Promise<void>;               // Function used to sign a user in with Google
    logout: () => Promise<void>;                        // Function used to sign the current user out
}

// Create authentication context (initially null)
const AuthContext = createContext<AuthContextValue | null>(null);

// Provider component to wrap app and supply authentication context
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAuthResolved, setIsAuthResolved] = useState(false);
    const [isProfileResolved, setIsProfileResolved] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        // Define Firestore listener
        let unsubscribeFirestore: (() => void) | null = null;

        // Attach Auth listener
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            // Clean up previous Firestore listener
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }

            // Reset profile for new user
            setIsProfileResolved(false);
            setUserProfile(null);

            // Store new user
            setUser(user);
            setIsAuthResolved(true);

            // Mark profile as resolved if there is no new user
            if (!user) {
                setIsProfileResolved(true);
                return;
            }

            // Attach Firestore listener
            unsubscribeFirestore = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
                // Store user's profile
                setUserProfile(docSnap.exists() ? (docSnap.data() as UserProfile) : null);
                setIsProfileResolved(true);
            });
        });

        // Cleanup both Auth and Firestore listeners on unmount
        return () => {
            if (unsubscribeFirestore) unsubscribeFirestore();
            unsubscribeAuth();
        };
    }, []);

    // Function used to register a new user
    async function register(data: RegisterForm) {
        // Begin registering user
        setIsRegistering(true);

        try {
            // Create Firebase Auth user
            const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);

            // Update user's Firebase Auth profile with a display name
            await updateProfile(user, { displayName: `${data.firstName} ${data.lastName}` });

            // Save user's profile to Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                dateOfBirth: data.dateOfBirth,
                address: data.address,
                role: "member",
                membershipStatus: "active",
                createdAt: new Date().toISOString().split("T")[0],
            });

            // Sign user out
            await signOut(auth);
        } catch (error) {
            throw error;
        } finally {
            // Finish registering user
            setIsRegistering(false);
        }
    }

    // Function used to sign a user in with email and password
    async function login(data: LoginForm) {
        await signInWithEmailAndPassword(auth, data.email, data.password);
    }

    // Function used to sign a user in with Google
    async function loginWithGoogle() {
        // Trigger Goggle sign-in popup
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        // Extract Firebase Auth user
        const user = result.user;

        // Check if user's profile already exists (i.e. returning user)
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        // Create a new profile if no profile exists
        if (!docSnap.exists()) {
            // Split Firebase Auth display name into first and last name
            const nameParts = user.displayName?.split(" ") ?? [];
            const firstName = nameParts[0] ?? "";
            const lastName = nameParts.slice(1).join(" ");

            // Construct new profile with default values
            const newProfile: UserProfile = {
                uid: user.uid,
                firstName,
                lastName,
                email: user.email ?? "",
                dateOfBirth: "",
                address: { line1: "", townOrCity: "", county: "", postcode: "" },
                role: "member",
                membershipStatus: "active",
                createdAt: new Date().toISOString().split("T")[0],
            };

            // Save user's profile to Firestore
            await setDoc(docRef, newProfile);
        }
    }

    // Function used to sign the current user out
    async function logout() {
        await signOut(auth);
    }

    // Provide authentication context to child components
    return (
        <AuthContext.Provider value={{ user, userProfile, isRegistering, register, login, loginWithGoogle, logout }}>
            {isAuthResolved && isProfileResolved ? children : <LoadingScreen />}
        </AuthContext.Provider>
    );
}

// Custom hook to access authentication context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
