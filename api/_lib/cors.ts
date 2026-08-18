import { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'https://arthneetinepal.web.app',
  'https://arthneetinepal.firebaseapp.com',
  'https://arthneetinepal.vercel.app',
  'https://ujjwaldhungana.github.io',
];

// Allow localhost only in development
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:5173');
}

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';

  if (!ALLOWED_ORIGINS.includes(origin)) {
    if (req.method === 'OPTIONS') {
      res.status(403).json({ error: 'Origin not allowed' });
      return true;
    }
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
