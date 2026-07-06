import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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

    initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
export { FieldValue };
