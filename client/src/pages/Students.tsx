import { useState } from 'react';
import { useStudents } from '../hooks/useStudents';
import { post } from '../services/api';
import { DataTable } from '../components/DataTable';
export function Students() {
  const students = useStudents(); const [name, setName] = useState(''); const [roll, setRoll] = useState(''); const [classId, setClassId] = useState('class-demo'); const [csv, setCsv] = useState('');
  async function add() { await post('/students', { name, rollNo: roll, classId }); window.location.reload(); }
  async function importCsv() { await post('/students/import', { classId, csv }); window.location.reload(); }
  return <div className="p-6"><h1 className="text-2xl font-bold mb-4">Students</h1><div className="flex gap-2 mb-4"><input className="border rounded px-2 py-1" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /><input className="border rounded px-2 py-1" placeholder="Roll no" value={roll} onChange={(e) => setRoll(e.target.value)} /><input className="border rounded px-2 py-1" placeholder="Class ID" value={classId} onChange={(e) => setClassId(e.target.value)} /><button className="bg-blue-600 text-white rounded px-3" onClick={add}>Add student</button></div><div className="mb-4"><textarea className="border rounded w-full p-2" rows={3} placeholder={"CSV import: name,rollNo per line"} value={csv} onChange={(e) => setCsv(e.target.value)} /><button className="bg-slate-800 text-white rounded px-3 py-1 mt-2" onClick={importCsv}>Import CSV</button></div><DataTable columns={['Name', 'Roll', 'Class', 'Status']} rows={students.map((s: any) => [s.name, s.rollNo, s.class?.name || s.classId, s.status])} /></div>;
}
