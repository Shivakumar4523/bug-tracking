import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import AppsPage from "@/pages/AppsPage";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import FiltersPage from "@/pages/FiltersPage";
import PeopleTeamsPage from "@/pages/PeopleTeamsPage";
import ProfilePage from "@/pages/ProfilePage";
import ReportsPage from "@/pages/ReportsPage";
import ProjectsPage from "@/pages/ProjectsPage";
import TaskListPage from "@/pages/TaskListPage";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/filters" element={<FiltersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/people" element={<PeopleTeamsPage />} />
        <Route path="/apps" element={<AppsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tasks" element={<TaskListPage />} />
        <Route path="/issues" element={<Navigate to="/filters" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
