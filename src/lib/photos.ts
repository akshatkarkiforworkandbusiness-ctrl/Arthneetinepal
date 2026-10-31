/**
 * Workshop photos served statically from `public/`.
 *
 * Two things about these filenames are easy to get wrong, and both silently
 * return a 404 (broken image icon) instead of throwing:
 *
 *   1. The folder is spelled "Pictures for Arthneeti" — it was originally
 *      committed as "Pitcures", which left half the site pointing at a
 *      directory that did not exist.
 *   2. The separator between the image number and the title is an EM DASH
 *      (—, U+2014), not a hyphen (-, U+002D). It renders identically in most
 *      editors, so the mismatch is invisible until the request 404s.
 *
 * Always import from here rather than hardcoding these paths.
 */

/**
 * Prefixed with import.meta.env.BASE_URL rather than hardcoded to "/" so the
 * paths survive a non-root VITE_BASE_PATH (e.g. hosting the app under
 * /arthneeti/). BASE_URL is "/" by default and always ends with a slash, so
 * the leading slash of PHOTO_DIR below is what gets dropped.
 */
const BASE = import.meta.env.BASE_URL || '/';

export const PHOTO_DIR = `${BASE}Pictures for Arthneeti`.replace(/\/{2,}/g, '/');

export const SESSION_PHOTOS = {
  inaugural: `${PHOTO_DIR}/Image 1 — Inaugural session (503020 Rule).jpg`,
  sosCenter: `${PHOTO_DIR}/Image 2 — SOS Disability Center.jpg`,
  stLawrence: `${PHOTO_DIR}/Image 3 — St. Lawrence School.png`,
  kvps: `${PHOTO_DIR}/Image 4 — Kathmandu Valley Public School.png`,
  problemSolving: `${PHOTO_DIR}/Image 5 — Problem solving session.jpg`,
  thinkBig: `${PHOTO_DIR}/Image 6 — Think Big. Invest Smart. Lead Nepal..jpg`,
} as const;

/** Ordered list, used when seeding event cover images. */
export const SESSION_PHOTO_LIST: string[] = [
  SESSION_PHOTOS.inaugural,
  SESSION_PHOTOS.sosCenter,
  SESSION_PHOTOS.stLawrence,
  SESSION_PHOTOS.kvps,
  SESSION_PHOTOS.problemSolving,
  SESSION_PHOTOS.thinkBig,
];
