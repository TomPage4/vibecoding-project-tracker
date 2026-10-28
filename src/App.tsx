import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams
} from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AppShell } from './components/layout/AppShell';
import { ProjectNewPage } from './pages/ProjectNewPage';
import { ProjectDashboardPage } from './pages/ProjectDashboardPage';
import { BoardPage } from './pages/BoardPage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { MilestoneListPage } from './pages/MilestoneListPage';
import { MilestoneDetailPage } from './pages/MilestoneDetailPage';
import { ProjectContextPage } from './pages/ProjectContextPage';
import { PromptLibraryPage } from './pages/PromptLibraryPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { TeamsPage } from './pages/TeamsPage';
import { ProfilePage } from './pages/ProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground" role="status">
        <span className="sr-only">Loading application...</span>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const ProjectRootRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/projects/${id}/board`} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="projects" element={<Navigate to="/dashboard" replace />} />
        <Route path="projects/new" element={<ProjectNewPage />} />
        <Route path="projects/:id" element={<ProjectRootRedirect />} />
        <Route path="projects/:id/dashboard" element={<ProjectDashboardPage />} />
        
        {/* Kanban routes (default project view) */}
        <Route path="projects/:id/board" element={<BoardPage />} />
        <Route path="projects/:id/board/tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="projects/:id/tasks/:taskId" element={<TaskDetailPage />} />
        
        {/* Milestone routes */}
        <Route path="projects/:id/milestones" element={<MilestoneListPage />} />
        <Route path="projects/:id/milestones/:milestoneId" element={<MilestoneDetailPage />} />
        
        {/* Context & Prompts & Settings */}
        <Route path="projects/:id/context" element={<ProjectContextPage />} />
        <Route path="projects/:id/prompts" element={<PromptLibraryPage />} />
        <Route path="projects/:id/settings" element={<ProjectSettingsPage />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
