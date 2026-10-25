import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export function Login() {
  const { login } = useAuth(); const nav = useNavigate(); const [email, setEmail] = useState('admin@demo.local'); const [password, setPassword] = useState('demo123'); const [err, setErr] = useState('');
  async function submit(e: any) { e.preventDefault(); try { await login(email, password); nav('/'); } catch { setErr('Login failed. Check the demo credentials and that the backend is running.'); } }
  return <div className="max-w-md mx-auto p-6"><h1 className="text-2xl font-bold mb-2">School Fee SaaS — Login</h1><p className="bg-yellow-100 p-3 rounded mb-4">Demo only: admin@demo.local / demo123 · super@demo.local / demo123 · accountant@demo.local / demo123</p><form onSubmit={submit} className="flex flex-col gap-3"><input className="border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" /><input className="border rounded px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /><button className="bg-blue-600 text-white rounded px-4 py-2">Login</button></form>{err && <p className="text-red-600 mt-3">{err}</p>}</div>;
}
