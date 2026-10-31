import { initializeApp, getApps, cert } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let initError: string | null = null;

/**
 * True when a service account credential was supplied.
 *
 * Token *verification* does not need a service account — the Admin SDK fetches
 * Google's public certificates for the project. Credentials are only required
 * for privileged calls (Firestore Admin, `getUser`, revocation checks). So we
 * initialise without them rather than failing every /api request with 401.
 */
let hasCredentials = false;

const apps = getApps();
if (!apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
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
      hasCredentials = true;
    } else {
      // No service account. Fall back to a credential-less app, which is still
      // enough to verify ID tokens. `projectId` is mandatory: without it the
      // SDK cannot validate the token's `aud` claim.
      const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.VITE_FIREBASE_PROJECT_ID;

      if (!projectId) {
        throw new Error(
          'Missing FIREBASE_SERVICE_ACCOUNT_JSON (and no FIREBASE_PROJECT_ID / ' +
          'VITE_FIREBASE_PROJECT_ID to fall back on).'
        );
      }

      adminApp = initializeApp({ projectId });
      console.warn(
        '[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_JSON is not set — running in ' +
        'token-verification-only mode. ID token checks work, but privileged calls ' +
        '(Firestore Admin, user lookup, revocation) are unavailable. Set the ' +
        'service account in your Vercel project settings to enable them.'
      );
    }
  } catch (error) {
    initError = error instanceof Error ? error.message : String(error);
    console.error("[firebaseAdmin] Initialization failed:", initError);
  }
} else {
  adminApp = apps[0];
  hasCredentials = true;
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

export function hasFirebaseAdminCredentials(): boolean {
  return hasCredentials;
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
