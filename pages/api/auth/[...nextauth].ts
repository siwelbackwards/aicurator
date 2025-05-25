// Empty TypeScript file to satisfy build
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock empty NextAuth handler
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ message: 'Static export - auth not available' });
}
