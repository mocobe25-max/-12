import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PageLoaderWrapper } from './components/PageLoaderWrapper';
import { InstallPrompt } from './components/InstallPrompt';
import { AdminLayout } from './layouts/AdminLayout';
import { AgentLayout } from './layouts/AgentLayout';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import CreateAgent from './pages/admin/CreateAgent';
import ManageAgents from './pages/admin/ManageAgents';
import AgentPaymentSetup from './pages/admin/AgentPaymentSetup';

// Agent Pages
import AgentLogin from './pages/agent/Login';
import VerifyInfo from './pages/agent/VerifyInfo';
import ActivationInfo from './pages/agent/ActivationInfo';
import Activate from './pages/agent/Activate';
import Review from './pages/agent/Review';
import AgentDashboard from './pages/agent/Dashboard';
import Suspended from './pages/agent/Suspended';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <PageLoaderWrapper>
        <Routes>
          <Route path="/" element={<Navigate to="/agent/login" replace />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="create-agent" element={<CreateAgent />} />
            <Route path="manage-agents" element={<ManageAgents />} />
            <Route path="agent-payment/:id" element={<AgentPaymentSetup />} />
          </Route>

          {/* Agent Routes */}
          <Route path="/agent/login" element={<AgentLogin />} />
          <Route path="/agent" element={<AgentLayout />}>
            <Route path="verify" element={<VerifyInfo />} />
            <Route path="activation-info" element={<ActivationInfo />} />
            <Route path="activate" element={<Activate />} />
            <Route path="review" element={<Review />} />
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="suspended" element={<Suspended />} />
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <InstallPrompt />
      </PageLoaderWrapper>
    </BrowserRouter>
  );
}

