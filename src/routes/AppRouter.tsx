import { Routes, Route } from "react-router-dom";

import { isEnvValid } from "../utils/env";
import { EnvErrorScreen } from "../components/EnvErrorScreen";
import { LoginPage } from "../components/LoginPage";
import AppShell from "../App";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

export const AppRouter = () => {
  if (!isEnvValid()) {
    return <EnvErrorScreen />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
