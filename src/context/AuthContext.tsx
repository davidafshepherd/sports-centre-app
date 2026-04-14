"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";

// Define shape of authentication context
interface AuthContextValue {
    currentUser: User | null;                // Firebase Auth user
    userProfile: UserProfile | null;         // User's profile (stored in Firestore)
    isAuthResolved: boolean;                 // Whether authentication is complete
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

// Create authentication context (initially null)
const AuthContext = createContext<AuthContextValue | null>(null);

// Provider component to wrap app and supply authentication context
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAuthResolved, setIsAuthResolved] = useState(false);

    useEffect(() => {
        // Listen for authentication state change
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            // Check if a user is logged in
            if (user) {
                // Fetch profile from Firestore using UID
                const docSnap = await getDoc(doc(db, "users", user.uid));
                setUserProfile(docSnap.exists() ? (docSnap.data() as UserProfile) : null);
            } else {
                // Clear profile when no user is logged in
                setUserProfile(null);
            }

            // Mark authentication as complete
            setIsAuthResolved(true);
        });

        // Cleanup listener on unmount
        return unsubscribe;
    }, []);

    // Function used to sign user in with email and password
    async function login(email: string, password: string) {
        await signInWithEmailAndPassword(auth, email, password);
    }

    // Function used to sign current user out
    async function logout() {
        await signOut(auth);
    }

    // Provide authentication context to child components
    return (
        <AuthContext.Provider value={{ currentUser, userProfile, isAuthResolved, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to access authentication context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
