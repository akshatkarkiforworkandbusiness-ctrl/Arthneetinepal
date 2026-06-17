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
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  handleJoinAction: () => Promise<void>;
  updateProfile: (data: { name: string; topics: string[]; email?: string }) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, topics: string[]) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider);
    setShowAuthModal(false);
  };

  const logout = () => signOut(auth);

  const handleJoinAction = async () => {
    if (!user) {
      setShowAuthModal(true);
    } else if (!profile) {
      setShowOnboarding(true);
    }
  };

  const updateProfile = async (data: { name: string; topics: string[]; email?: string }) => {
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
        joinedAt: existingProfile?.joinedAt || serverTimestamp()
      };
      
      await setDoc(docRef, profileData, { merge: true });
      setProfile(profileData);
      setShowOnboarding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string, topics: string[]) => {
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
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    setShowAuthModal(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
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
