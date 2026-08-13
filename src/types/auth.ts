import type { User } from "firebase/auth";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  college: string;
  yearOfStudy: string;
  bio: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
}

export interface AuthContextValue {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfileData: (input: ProfileUpdateInput) => Promise<void>;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  college: string;
  yearOfStudy: string;
}

export interface ProfileUpdateInput {
  name: string;
  college: string;
  yearOfStudy: string;
  bio: string;
  avatar: string;
}
