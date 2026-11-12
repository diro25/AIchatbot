import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { ChatPage } from './pages/ChatPage';
import { useAuth } from './context/AuthContext';

function RequireAuth({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <div className="loading-screen"><span className="status-dot" /> Restoring your room…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function PublicOnly({ children }) {
  const { user, status } = useAuth();
  if (status === 'loading') return <div className="loading-screen"><span className="status-dot" /> Loading…</div>;
  if (user) return <Navigate to="/chat" replace />;
  return children;
}

export function App() {
  return <Routes>
    <Route path="/login" element={<PublicOnly><AuthPage mode="login" /></PublicOnly>} />
    <Route path="/register" element={<PublicOnly><AuthPage mode="register" /></PublicOnly>} />
    <Route path="/" element={<RequireAuth><Navigate to="/chat" replace /></RequireAuth>} />
    <Route path="/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
    <Route path="/chat/:conversationId" element={<RequireAuth><ChatPage /></RequireAuth>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
