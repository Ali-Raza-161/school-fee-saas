import { useEffect, useState } from 'react';
import { get } from '../services/api';
export function ParentPortal() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { get('/parent/children').then(setData).catch(() => setData(null)); }, []);
  return <div className="p-6"><h1 className="text-2xl font-bold mb-4">Parent Portal</h1><p className="mb-3 text-slate-600">Login with a parent email to see a child's fee history, dues and downloads. In the demo seed, parent records are created when a student is linked to a parent — use the API to add parents, or view the demo note below.</p>{data?.note && <p>{data.note}</p>}{data?.children?.map((c: any, i: number) => <div key={i} className="border rounded p-4 mb-3"><b>{c.name}</b>{c.vouchers?.map((v: any, j: number) => <p key={j}>{v.month}/{v.year}: payable {v.payable}, paid {v.paid}, {v.status}</p>)}</div>)}</div>;
}
