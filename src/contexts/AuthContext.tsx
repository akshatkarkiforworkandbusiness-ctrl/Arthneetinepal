import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile
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
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  handleJoinAction: () => Promise<void>;
  updateProfile: (data: { name: string; topics: string[]; email?: string; schoolId?: string; publicPortfolio?: boolean }) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, topics: string[]) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const adminRef = doc(db, 'admins', user.uid);
        try {
          const [docSnap, adminSnap] = await Promise.all([
            getDoc(docRef),
            getDoc(adminRef)
          ]);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setIsAdmin(adminSnap.exists());
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          setIsAdmin(false);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
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
      showOnboarding, 
      setShowOnboarding, 
      showAuthModal,
      setShowAuthModal,
      signIn, 
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
