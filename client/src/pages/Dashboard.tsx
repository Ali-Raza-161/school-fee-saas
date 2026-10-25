import { useEffect, useState } from 'react';
import { get } from '../services/api';
export function Dashboard() {
  const [coll, setColl] = useState<any>(null); const [def, setDef] = useState<any[]>([]);
  useEffect(() => { get('/reports/collection').then(setColl).catch(() => setColl(null)); get('/reports/defaulters').then(setDef).catch(() => setDef([])); }, []);
  return <div className="p-6"><h1 className="text-2xl font-bold mb-4">Dashboard</h1><div className="grid grid-cols-3 gap-4"><div className="border rounded p-4"><b>Collection total</b><p className="text-2xl">PKR {coll?.total ?? '—'}</p></div><div className="border rounded p-4"><b>Payments</b><p className="text-2xl">{coll?.count ?? '—'}</p></div><div className="border rounded p-4"><b>Defaulters</b><p className="text-2xl">{def.length}</p></div></div><p className="mt-4 text-slate-600">Today's and monthly collection, pending dues and defaulter count come from the same reports API used by the Reports page. Charts are simple totals in v1; Recharts can be wired to these endpoints next.</p></div>;
}
