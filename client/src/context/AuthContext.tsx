import { createContext, useContext, useState, ReactNode } from 'react';
import { post } from '../services/api';
export interface User { id: string; name: string; email: string; role: string; schoolId?: string | null; }
const Ctx = createContext<any>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('fee_user') || 'null'); } catch { return null; } });
  async function login(email: string, password: string) { const d = await post('/auth/login', { email, password }); localStorage.setItem('fee_token', d.token); localStorage.setItem('fee_user', JSON.stringify(d.user)); setUser(d.user); return d.user; }
  function logout() { localStorage.removeItem('fee_token'); localStorage.removeItem('fee_user'); setUser(null); }
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
