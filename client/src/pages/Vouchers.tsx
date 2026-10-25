import { useState } from 'react';
import { useVouchers } from '../hooks/useVouchers';
import { post } from '../services/api';
import { DataTable } from '../components/DataTable';
import { VoucherPreview } from '../components/VoucherPreview';
export function Vouchers() {
  const vouchers = useVouchers(); const [month, setMonth] = useState('10'); const [year, setYear] = useState('2026'); const [msg, setMsg] = useState('');
  return <div className="p-6"><h1 className="text-2xl font-bold mb-4">Vouchers</h1><div className="flex gap-2 mb-3"><input className="border rounded px-2 py-1" value={month} onChange={(e) => setMonth(e.target.value)} /><input className="border rounded px-2 py-1" value={year} onChange={(e) => setYear(e.target.value)} /><button className="bg-blue-600 text-white rounded px-3" onClick={async () => { const r = await post('/vouchers/generate', { month: Number(month), year: Number(year) }); setMsg(`Generated ${r.created}, skipped ${r.skipped} (already exist).`); window.location.reload(); }}>Generate monthly vouchers</button></div>{msg && <p className="mb-3">{msg}</p>}<DataTable columns={['Student', 'Month', 'Payable', 'Paid', 'Status']} rows={vouchers.map((v: any) => [v.student?.name, `${v.month}/${v.year}`, v.payable, v.paid, v.status])} />{vouchers[0] && <div className="mt-4"><VoucherPreview v={vouchers[0]} /><p className="text-sm mt-2">Download a voucher PDF from the API: GET /api/vouchers/:id/pdf (authenticated, tenant-scoped).</p></div>}</div>;
}
