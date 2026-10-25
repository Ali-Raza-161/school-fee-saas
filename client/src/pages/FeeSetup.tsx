import { useEffect, useState } from 'react';
import { get, post } from '../services/api';
import { DataTable } from '../components/DataTable';
export function FeeSetup() {
  const [rows, setRows] = useState<any[]>([]); const [classId, setClassId] = useState('class-demo'); const [head, setHead] = useState('tuition'); const [amount, setAmount] = useState('5000');
  useEffect(() => { get('/fee-structures').then(setRows).catch(() => setRows([])); }, []);
  return <div className="p-6"><h1 className="text-2xl font-bold mb-4">Fee Setup</h1><p className="mb-3 text-slate-600">Fee heads: tuition, admission, exam, transport, lab, annual. Set a structure per class.</p><div className="flex gap-2 mb-4"><input className="border rounded px-2 py-1" placeholder="Class ID" value={classId} onChange={(e) => setClassId(e.target.value)} /><input className="border rounded px-2 py-1" placeholder="Fee head" value={head} onChange={(e) => setHead(e.target.value)} /><input className="border rounded px-2 py-1" placeholder="Amount PKR" value={amount} onChange={(e) => setAmount(e.target.value)} /><button className="bg-blue-600 text-white rounded px-3" onClick={async () => { await post('/fee-structures', { classId, feeHeadName: head, amount: Number(amount) }); window.location.reload(); }}>Save structure</button></div><DataTable columns={['Class', 'Fee head', 'Amount']} rows={rows.map((r: any) => [r.class?.name || r.classId, r.feeHead?.name, r.amount])} /></div>;
}
