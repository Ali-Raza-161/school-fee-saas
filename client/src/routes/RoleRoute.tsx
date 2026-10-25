import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export function RoleRoute({ roles, children }: any) { const { user } = useAuth(); if (!user) return <Navigate to="/login" replace />; return roles.includes(user.role) ? children : <div className="p-6">This page is not available for your role ({user.role}).</div>; }
