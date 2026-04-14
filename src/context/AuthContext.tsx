"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";
import { LoginForm } from "@/features/auth/schemas/loginFormSchema";
import { RegisterForm } from "@/features/auth/schemas/registerFormSchema";
import { 
    User, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile, 
    signOut, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup, 
} from "firebase/auth";

// Define shape of authentication context
interface AuthContextValue {
    currentUser: User | null;           // Firebase Auth user
    userProfile: UserProfile | null;    // User's profile (stored in Firestore)
    isAuthResolved: boolean;            // Whether authentication is complete
    isProfileResolved: boolean;         // Whether the user's profile has been fetched
    isRegisteringUser: boolean;         // Wether a user is being registered
    register: (data: RegisterForm) => Promise<void>;
    login: (data: LoginForm) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

// Create authentication context (initially null)
const AuthContext = createContext<AuthContextValue | null>(null);

// Provider component to wrap app and supply authentication context
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAuthResolved, setIsAuthResolved] = useState(false);
    const [isProfileResolved, setIsProfileResolved] = useState(false);
    const [isRegisteringUser, setIsRegisteringUser] = useState(false);

    useEffect(() => {
        // Initialise Firestore listener
        let unsubscribeFirestore: (() => void) | null = null;

        // Attach Auth listener
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            // Store current user
            setCurrentUser(user);
            setIsAuthResolved(true);

            // Clean up previous Firestore listener
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }

            // Reset profile for new user
            setUserProfile(null);
            setIsProfileResolved(false);

            // Mark profile as resolved if no user is logged in
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
        setIsRegisteringUser(true);

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
        }
        catch  (error) {
            throw error;
        }
        finally {
            setIsRegisteringUser(false);
        }
    }

    // Function used to sign user in with email and password
    async function login(data: LoginForm) {
        await signInWithEmailAndPassword(auth, data.email, data.password);
    }

    // Function used to sign user in with Google
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
                firstName: firstName,
                lastName: lastName,
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

    // Function used to sign current user out
    async function logout() {
        await signOut(auth);
    }

    // Provide authentication context to child components
    return (
        <AuthContext.Provider 
            value={{ 
                currentUser, 
                userProfile, 
                isAuthResolved, 
                isProfileResolved,
                isRegisteringUser, 
                register, 
                login, 
                loginWithGoogle, 
                logout, 
            }}
        >
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
