import { VercelRequest } from '@vercel/node';
import { getAdminAuth, isFirebaseAdminReady, getFirebaseAdminError } from './firebaseAdmin';

export async function verifyUser(req: VercelRequest): Promise<string | null> {
  if (!isFirebaseAdminReady()) {
    console.error('[auth] Firebase Admin not ready:', getFirebaseAdminError());
    return null;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return null;
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token, true);
    return decodedToken.uid;
  } catch (error: any) {
    // Distinguish between different failure modes
    const code = error?.code || '';
    if (code === 'auth/id-token-expired') {
      console.error('[auth] Token expired — user needs to re-authenticate');
    } else if (code === 'auth/id-token-revoked') {
      console.error('[auth] Token revoked — user session was invalidated');
    } else if (code === 'auth/invalid-id-token') {
      console.error('[auth] Invalid ID token format');
    } else if (code === 'auth/argument-error') {
      console.error('[auth] Malformed token');
    } else {
      console.error('[auth] Token verification failed:', error?.message || error);
    }
    return null;
  }
}
