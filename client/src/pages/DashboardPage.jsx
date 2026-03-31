import { useAuth } from "@/hooks/use-auth";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import UserDashboardPage from "@/pages/UserDashboardPage";
import { normalizeRole } from "@/lib/utils";

const DashboardPage = () => {
  const { user } = useAuth();

  return normalizeRole(user?.role) === "Admin" ? (
    <AdminDashboardPage />
  ) : (
    <UserDashboardPage />
  );
};

export default DashboardPage;
