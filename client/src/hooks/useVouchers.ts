import { useEffect, useState } from 'react';
import { get } from '../services/api';
export function useVouchers() { const [vouchers, setVouchers] = useState<any[]>([]); useEffect(() => { get('/vouchers').then(setVouchers).catch(() => setVouchers([])); }, []); return vouchers; }
