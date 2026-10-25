// Tenant isolation: school_id comes ONLY from the JWT, never from user input.
// Super admin has schoolId = null and may list schools, but tenant-scoped
// routes below always filter by the token's schoolId.
import { Response, NextFunction } from 'express';
import { AuthedRequest } from './auth';
export function tenantRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Login required' });
  if (req.user.role === 'super_admin') { req.schoolId = req.schoolId || null; return next(); }
  if (!req.schoolId) return res.status(403).json({ error: 'No school in token' });
  next();
}
export function tenantWhere(req: AuthedRequest): { schoolId: string } {
  // Callers must use this, never req.body.schoolId / req.query.schoolId.
  return { schoolId: String(req.schoolId) };
}
