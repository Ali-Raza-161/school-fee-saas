import { useEffect, useState } from 'react';
import { get, post } from '../services/api';
import { DataTable } from '../components/DataTable';
export function Classes() {
  const [rows, setRows] = useState<any[]>([]); const [name, setName] = useState(''); const [section, setSection] = useState('A');
  useEffect(() => { get('/classes').then(setRows).catch(() => setRows([])); }, []);
  return <div className="p-6"><h1 className="text-2xl font-bold mb-4">Classes & Sections</h1><div className="flex gap-2 mb-4"><input className="border rounded px-2 py-1" placeholder="Class name" value={name} onChange={(e) => setName(e.target.value)} /><input className="border rounded px-2 py-1" placeholder="Section" value={section} onChange={(e) => setSection(e.target.value)} /><button className="bg-blue-600 text-white rounded px-3" onClick={async () => { await post('/classes', { name, section }); window.location.reload(); }}>Add class</button></div><DataTable columns={['Class', 'Section']} rows={rows.map((c: any) => [c.name, c.section])} /></div>;
}
