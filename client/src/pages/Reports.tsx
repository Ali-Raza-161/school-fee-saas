import { useEffect, useState } from 'react';
import { get } from '../services/api';
import { DataTable } from '../components/DataTable';
export function Reports() {
  const [coll, setColl] = useState<any>(null); const [def, setDef] = useState<any[]>([]);
  useEffect(() => { get('/reports/collection').then(setColl).catch(() => setColl(null)); get('/reports/defaulters').then(setDef).catch(() => setDef([])); }, []);
  return <div className="p-6"><h1 className="text-2xl font-bold mb-4">Reports</h1><p className="mb-3">Collection total: PKR {coll?.total ?? '—'} · Payments: {coll?.count ?? '—'} · By method: {coll ? JSON.stringify(coll.byMethod) : '—'}</p><p className="mb-3 text-sm text-slate-600">Excel export is available from the API: GET /api/reports/collection/export (authenticated).</p><h2 className="font-bold mb-2">Defaulter list</h2><DataTable columns={['Student', 'Month', 'Due', 'Status']} rows={def.map((d: any) => [d.student, `${d.month}/${d.year}`, d.due, d.status])} /></div>;
}
