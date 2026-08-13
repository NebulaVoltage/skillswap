import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, firebaseConfigReady, missingFirebaseKeys } from "../lib/firebase";
import type { ProfileUpdateInput, SignUpInput, UserProfile } from "../types/auth";

function requireFirebase() {
  if (!firebaseConfigReady || !auth || !db) {
    throw new Error(
      `Firebase configuration is incomplete. Missing: ${missingFirebaseKeys.join(", ")}`,
    );
  }
  return { auth, db };
}

function mapFirestoreProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    college: String(data.college ?? ""),
    yearOfStudy: String(data.yearOfStudy ?? ""),
    bio: String(data.bio ?? ""),
    avatar: String(data.avatar ?? ""),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
    onboardingCompleted: Boolean(data.onboardingCompleted),
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const authService = {
  async initializePersistence() {
    const { auth } = requireFirebase();
    await setPersistence(auth, browserLocalPersistence);
  },

  onAuthChange(callback: (user: User | null) => void) {
    const { auth } = requireFirebase();
    return onAuthStateChanged(auth, callback);
  },

  async signUp(input: SignUpInput) {
    const { auth, db } = requireFirebase();
    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
    const profile: Omit<UserProfile, "createdAt" | "updatedAt"> = {
      uid: credential.user.uid,
      name: input.name,
      email: input.email,
      college: input.college,
      yearOfStudy: input.yearOfStudy,
      bio: "Tell the SkillSwap community what you love building and what you want to learn.",
      avatar: initials(input.name),
      onboardingCompleted: true,
    };

    await setDoc(doc(db, "users", credential.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async signIn(email: string, password: string) {
    const { auth } = requireFirebase();
    await signInWithEmailAndPassword(auth, email, password);
  },

  async signOut() {
    const { auth } = requireFirebase();
    await signOut(auth);
  },

  async getUserProfile(uid: string) {
    const { db } = requireFirebase();
    const snapshot = await getDoc(doc(db, "users", uid));
    if (!snapshot.exists()) {
      return null;
    }
    return mapFirestoreProfile(uid, snapshot.data());
  },

  onUserProfileChange(uid: string, callback: (profile: UserProfile | null) => void) {
    const { db } = requireFirebase();
    return onSnapshot(doc(db, "users", uid), (snapshot) => {
      if (snapshot.exists()) {
        callback(mapFirestoreProfile(uid, snapshot.data()));
      } else {
        callback(null);
      }
    });
  },

  async updateUserProfile(uid: string, input: ProfileUpdateInput) {
    const { db } = requireFirebase();
    await updateDoc(doc(db, "users", uid), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  },
};
