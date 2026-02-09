import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes/AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

window.addEventListener("unhandledrejection", (event) => {
  // Prevent blank screen on async errors
  // eslint-disable-next-line no-console
  console.error("Unhandled promise rejection:", event.reason);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* SAI: font-['M_PLUS_Rounded_1c'] */}
    {/* ĐÚNG: font-mplus (hoặc font-fredoka) */}
    <div className="font-mplus antialiased">
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </div>
  </React.StrictMode>
);
