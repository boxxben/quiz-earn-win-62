
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, hydrated } = useAuth();

  // Wait for auth hydration to avoid rendering the child prematurely
  if (!hydrated) {
    return null;
  }

  // Redirect non-admin users
  if (!user?.isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
