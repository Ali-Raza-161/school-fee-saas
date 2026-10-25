import { useEffect, useState } from 'react';
import { get, post } from '../services/api';
import { DataTable } from '../components/DataTable';
export function SuperAdmin() {
  const [schools, setSchools] = useState<any[]>([]); const [stats, setStats] = useState<any>(null); const [name, setName] = useState('');
  useEffect(() => { get('/schools').then(setSchools).catch(() => setSchools([])); get('/stats').then(setStats).catch(() => setStats(null)); }, []);
  return <div className="p-6"><h1 className="text-2xl font-bold mb-4">Super Admin</h1><p className="mb-3">Platform: {stats?.schools ?? '—'} schools · {stats?.students ?? '—'} students · Collection PKR {stats?.monthlyCollection ?? '—'}</p><p className="mb-3 text-sm">Plans (example prices): Starter up to 200 students PKR 3,000 · Standard up to 600 PKR 6,000 · Premium up to 1,500 PKR 10,000.</p><div className="flex gap-2 mb-4"><input className="border rounded px-2 py-1" placeholder="New school name" value={name} onChange={(e) => setName(e.target.value)} /><button className="bg-blue-600 text-white rounded px-3" onClick={async () => { await post('/schools', { name }); window.location.reload(); }}>Register school</button></div><DataTable columns={['School', 'Status', 'Students']} rows={schools.map((s: any) => [s.name, s.status, s._count?.students ?? ''])} /></div>;
}
