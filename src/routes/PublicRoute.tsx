import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type PublicRouteProps = {
  children: JSX.Element;
};

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};
