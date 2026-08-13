import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { firebaseConfigReady, missingFirebaseKeys } from "./lib/firebase";

export function ProtectedRoute() {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (!firebaseConfigReady) {
    return <SetupRequired />;
  }

  if (authLoading) {
    return <LoadingScreen label="Checking your SkillSwap session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, authLoading } = useAuth();

  if (!firebaseConfigReady) {
    return <SetupRequired />;
  }

  if (authLoading) {
    return <LoadingScreen label="Preparing SkillSwap..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="section-kicker">Loading</p>
        <h2>{label}</h2>
      </div>
    </div>
  );
}

export function SetupRequired() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="section-kicker">Firebase setup required</p>
        <h2>SkillSwap needs your Firebase web app configuration.</h2>
        <p>
          Add the missing Vite variables in a local <code>.env</code> file, then restart the dev
          server.
        </p>
        <div className="tag-row">
          {missingFirebaseKeys.map((key) => (
            <span className="subtle-chip" key={key}>
              {key}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
