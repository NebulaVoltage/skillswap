import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/auth";
import { firebaseConfigReady } from "../lib/firebase";
import type {
  AuthContextValue,
  ProfileUpdateInput,
  SignUpInput,
  UserProfile,
} from "../types/auth";
import type { User } from "firebase/auth";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseConfigReady) {
      setAuthLoading(false);
      setAuthError("Firebase configuration is missing.");
      return;
    }

    void authService.initializePersistence().catch((error: unknown) => {
      setAuthLoading(false);
      setAuthError(error instanceof Error ? error.message : "Failed to initialize auth.");
    });

    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = authService.onAuthChange((user) => {
      setCurrentUser(user);
      if (!user) {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = undefined;
        }
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }

      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      let profileTimeout: ReturnType<typeof setTimeout>;

      unsubscribeProfile = authService.onUserProfileChange(user.uid, (profile) => {
        setUserProfile(profile);
        if (profile) {
          setAuthLoading(false);
          clearTimeout(profileTimeout);
        }
      });

      profileTimeout = setTimeout(() => {
        setAuthLoading(false);
      }, 3000);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const refreshProfile = async (uid: string) => {
    const profile = await authService.getUserProfile(uid);
    setUserProfile(profile);
  };

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    await authService.signIn(email, password);
  };

  const signUp = async (input: SignUpInput) => {
    setAuthError(null);
    await authService.signUp(input);
  };

  const signOutUser = async () => {
    setAuthError(null);
    await authService.signOut();
  };

  const updateProfileData = async (input: ProfileUpdateInput) => {
    if (!currentUser) {
      throw new Error("No authenticated user.");
    }
    setAuthError(null);
    await authService.updateUserProfile(currentUser.uid, input);
    await refreshProfile(currentUser.uid);
  };

  const value: AuthContextValue = {
    currentUser,
    userProfile,
    isAuthenticated: Boolean(currentUser),
    authLoading,
    authError,
    signIn,
    signUp,
    signOutUser,
    updateProfileData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
