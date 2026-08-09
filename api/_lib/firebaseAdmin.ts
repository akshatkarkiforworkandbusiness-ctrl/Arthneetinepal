import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let initError: string | null = null;

const apps = getApps();
if (!apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON env var");
    }

    let serviceAccount: any;
    if (serviceAccountJson.trim().startsWith('{')) {
      serviceAccount = JSON.parse(serviceAccountJson);
    } else {
      // Assume Base64 encoded
      const decoded = Buffer.from(serviceAccountJson, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (error) {
    initError = error instanceof Error ? error.message : String(error);
    console.error("[firebaseAdmin] Initialization failed:", initError);
  }
} else {
  adminApp = apps[0];
}

function requireAdmin() {
  if (!adminApp) {
    throw new Error(
      `Firebase Admin SDK not initialized. ${initError ? `Reason: ${initError}` : 'Unknown error.'} ` +
      'Ensure FIREBASE_SERVICE_ACCOUNT_JSON is set in Vercel environment variables.'
    );
  }
}

export function isFirebaseAdminReady(): boolean {
  return adminApp !== null;
}

export function getFirebaseAdminError(): string | null {
  return initError;
}

// Lazy getters — only call after verifying readiness
export function getAdminDb() {
  requireAdmin();
  return getFirestore(adminApp!);
}

export function getAdminAuth() {
  requireAdmin();
  return getAuth(adminApp!);
}

// Convenience re-exports (backward compatible)
export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_, prop) {
    return (getAdminDb() as any)[prop];
  }
});

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_, prop) {
    return (getAdminAuth() as any)[prop];
  }
});

export { FieldValue };
