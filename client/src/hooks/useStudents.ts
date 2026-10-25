import { useEffect, useState } from 'react';
import { get } from '../services/api';
export function useStudents() { const [students, setStudents] = useState<any[]>([]); useEffect(() => { get('/students').then(setStudents).catch(() => setStudents([])); }, []); return students; }
