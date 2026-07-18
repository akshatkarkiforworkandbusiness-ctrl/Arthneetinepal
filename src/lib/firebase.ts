import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const envVars: Record<string, string> = {};
for (const key of requiredEnvVars) {
  const raw = import.meta.env[key];
  envVars[key] = typeof raw === 'string' ? raw.trim() : (raw ?? '');
}

const missingVars = requiredEnvVars.filter(
  (key) => !envVars[key]
);

if (missingVars.length > 0) {
  const errorMsg = `Missing required Firebase environment variables: ${missingVars.join(', ')}. ` +
    'Please create a .env file with these variables set. See .env.example for reference.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

const firebaseConfig = {
  apiKey: envVars['VITE_FIREBASE_API_KEY'],
  authDomain: envVars['VITE_FIREBASE_AUTH_DOMAIN'],
  projectId: envVars['VITE_FIREBASE_PROJECT_ID'],
  storageBucket: envVars['VITE_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: envVars['VITE_FIREBASE_MESSAGING_SENDER_ID'],
  appId: envVars['VITE_FIREBASE_APP_ID'],
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow = true) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (shouldThrow) throw new Error(JSON.stringify(errInfo));
}
