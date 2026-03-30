import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    // Push unauthorized users natively back into the Login flow immediately bounding sensitive layouts.
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
