import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export function Sidebar() {
  const { user, logout } = useAuth();
  const links = [['/dashboard', 'Dashboard'], ['/students', 'Students'], ['/classes', 'Classes'], ['/fee-setup', 'Fee Setup'], ['/vouchers', 'Vouchers'], ['/payments', 'Payments'], ['/reports', 'Reports'], ['/parent', 'Parent Portal'], ['/super-admin', 'Super Admin']];
  return <aside className="w-56 shrink-0 bg-slate-900 text-white p-4 min-h-screen">
    <h1 className="font-bold text-lg mb-1">School Fee SaaS</h1><p className="text-xs text-slate-300 mb-4">{user?.name} · {user?.role}</p>
    <nav className="flex flex-col gap-1">{links.map(([to, label]) => <Link key={to} to={to} className="px-3 py-2 rounded hover:bg-slate-700">{label}</Link>)}</nav>
    <button onClick={logout} className="mt-6 px-3 py-2 rounded bg-slate-700 w-full">Logout</button>
    <p className="text-xs text-slate-400 mt-6">Demo only. Payments in v1 are recorded manually; no online gateway.</p>
  </aside>;
}
