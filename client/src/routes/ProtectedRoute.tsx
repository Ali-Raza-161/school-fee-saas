import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export function ProtectedRoute({ children }: any) { const { user } = useAuth(); return user ? children : <Navigate to="/login" replace />; }
