"use client";

import { User, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

// Shape of the auth context
interface AuthContextType {
    user: User | null;
    loading: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

// Provider component to wrap the app and supply auth state
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);    // Stores logged-in user
    const [loading, setLoading] = useState(true);           // Tracks loading state

    // Listen for authentication state changes (login/logout)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);  // Update user state
            setLoading(false);      // Auth check complete
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, []);

    // Provide user + loading state to all children components
    return (
        <AuthContext.Provider value={{ user, loading }}>
        {children}
        </AuthContext.Provider>
    );
}

// Custom hook for easy access to auth context
export function useAuth() {
    return useContext(AuthContext);
}