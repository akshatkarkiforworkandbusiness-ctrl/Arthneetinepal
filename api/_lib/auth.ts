import type { VercelRequest } from '@vercel/node';
import { createHash, timingSafeEqual } from 'node:crypto';
import { getAdminAuth, isFirebaseAdminReady, hasFirebaseAdminCredentials, getFirebaseAdminError } from './firebaseAdmin.js';

/**
 * Constant-time string comparison for shared secrets (CRON_SECRET, API keys).
 *
 * `a === b` short-circuits on the first differing byte, which leaks the
 * position of the first mismatch through response timing. Hashing both sides
 * first makes the comparison fixed-length and independent of the inputs'
 * lengths, so timingSafeEqual stays safe even when the attacker supplies a
 * much longer string.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a, 'utf8').digest();
  const hb = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ha, hb);
}

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
    /* checkRevoked calls getUser() under the hood, which needs a service
     * account. Without one we still verify the signature and claims — that is
     * what actually authenticates the request — and skip the revocation sweep. */
    const decodedToken = await getAdminAuth().verifyIdToken(
      token,
      hasFirebaseAdminCredentials()
    );
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
