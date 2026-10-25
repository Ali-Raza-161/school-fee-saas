import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Classes } from './pages/Classes';
import { FeeSetup } from './pages/FeeSetup';
import { Vouchers } from './pages/Vouchers';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { ParentPortal } from './pages/ParentPortal';
import { SuperAdmin } from './pages/SuperAdmin';
import { Home } from './pages/Home';
function Layout() { return <div className="flex"><Sidebar /><main className="flex-1"><Outlet /></main></div>; }
export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Home />} />
    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/students" element={<Students />} />
      <Route path="/classes" element={<Classes />} />
      <Route path="/fee-setup" element={<FeeSetup />} />
      <Route path="/vouchers" element={<Vouchers />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/parent" element={<ParentPortal />} />
      <Route path="/super-admin" element={<RoleRoute roles={['super_admin']}><SuperAdmin /></RoleRoute>} />
    </Route>
  </Routes></BrowserRouter></AuthProvider>;
}
