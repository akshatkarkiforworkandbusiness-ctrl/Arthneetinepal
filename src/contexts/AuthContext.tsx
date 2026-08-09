import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  browserPopupRedirectResolver
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: "member" | "admin";
  topics: string[];
  joinedAt: any;
  schoolId?: string;
  publicPortfolio?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  profileLoading: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  signIn: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  handleJoinAction: () => Promise<void>;
  updateProfile: (data: { name: string; topics: string[]; email?: string; schoolId?: string; publicPortfolio?: boolean }) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, topics: string[]) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(user: User): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', user.uid);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${user.uid}`, false);
    return null;
  }
}

async function fetchIsAdmin(uid: string): Promise<boolean> {
  try {
    const adminRef = doc(db, 'admins', uid);
    const adminSnap = await getDoc(adminRef);
    return adminSnap.exists();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const loadUserProfile = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
    try {
      const [profileData, adminStatus] = await Promise.all([
        fetchUserProfile(firebaseUser),
        fetchIsAdmin(firebaseUser.uid),
      ]);
      setProfile(profileData);
      setIsAdmin(adminStatus);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    // Handle redirect result on page load
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        setShowAuthModal(false);
      }
    }).catch((error) => {
      console.error('Redirect result error:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [loadUserProfile]);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      // If popup is blocked or fails, throw so the UI can offer redirect fallback
      throw error;
    }
  };

  const signInWithGoogleRedirect = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error('Redirect sign-in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const handleJoinAction = async () => {
    if (!user) {
      setShowAuthModal(true);
    } else if (!profile) {
      setShowOnboarding(true);
    }
  };

  const updateProfile = async (data: { name: string; topics: string[]; email?: string; schoolId?: string; publicPortfolio?: boolean }) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      const existingProfile = docSnap.exists() ? docSnap.data() as UserProfile : null;

      const profileData: UserProfile = {
        uid: user.uid,
        name: data.name,
        email: data.email || user.email || '',
        topics: data.topics,
        role: existingProfile?.role || 'member',
        joinedAt: existingProfile?.joinedAt || serverTimestamp(),
        schoolId: data.schoolId !== undefined ? data.schoolId : existingProfile?.schoolId,
        publicPortfolio: data.publicPortfolio !== undefined ? data.publicPortfolio : existingProfile?.publicPortfolio
      };
      
      // Clean undefined keys
      if (profileData.schoolId === undefined) delete profileData.schoolId;
      if (profileData.publicPortfolio === undefined) delete profileData.publicPortfolio;
      
      await setDoc(docRef, profileData, { merge: true });
      setProfile(profileData);
      setShowOnboarding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string, topics: string[]) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      await firebaseUpdateProfile(firebaseUser, { displayName: name });
      
      const docRef = doc(db, 'users', firebaseUser.uid);
      const profileData: UserProfile = {
        uid: firebaseUser.uid,
        name,
        email,
        topics,
        role: 'member',
        joinedAt: serverTimestamp()
      };
      
      await setDoc(docRef, profileData);
      setProfile(profileData);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      isAdmin,
      loading, 
      profileLoading,
      showOnboarding, 
      setShowOnboarding, 
      showAuthModal,
      setShowAuthModal,
      signIn, 
      signInWithGoogleRedirect,
      logout, 
      handleJoinAction, 
      updateProfile,
      signUpWithEmail,
      signInWithEmail,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
