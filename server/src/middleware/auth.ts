import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export interface AuthedRequest extends Request { user?: any; schoolId?: string | null; }
export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'school-fee-dev-secret-change-me');
    req.user = payload; req.schoolId = payload.schoolId || null;
    next();
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}
export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Role not allowed' });
    next();
  };
}
