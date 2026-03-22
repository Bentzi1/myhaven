import { startTransition, useEffect, useMemo, useState } from "react";
import {
  acceptPolicies,
  createGuestSession,
  getActivePolicy,
  getAuthConfig,
  getCurrentSession,
  getMyStories,
  loginManualAccount,
  logout,
  registerManualAccount
} from "./lib/api";
import { ConsentScreen } from "./components/auth/ConsentScreen";
import { AuthShell } from "./components/auth/AuthShell";
import { GoogleCallbackScreen } from "./components/auth/GoogleCallbackScreen";
import { GuestSessionScreen } from "./components/auth/GuestSessionScreen";
import { ManualAuthScreen } from "./components/auth/ManualAuthScreen";
import { RegisteredDashboard } from "./components/auth/RegisteredDashboard";
import { OnboardingScreen } from "./components/onboarding/OnboardingScreen";

const sessionTokenStorageKey = "myhaven.session.token";

function getStoredToken() {
  return window.localStorage.getItem(sessionTokenStorageKey);
}

function setStoredToken(token) {
  if (token) {
    window.localStorage.setItem(sessionTokenStorageKey, token);
    return;
  }

  window.localStorage.removeItem(sessionTokenStorageKey);
}

function App() {
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState("welcome");
  const [manualMode, setManualMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [authConfig, setAuthConfig] = useState({
    googleEnabled: false
  });
  const [activePolicy, setActivePolicy] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardBusy, setDashboardBusy] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [pathname, setPathname] = useState(window.location.pathname);

  const googleCallbackError = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("error") || "";
  }, [pathname]);

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [configPayload, policyPayload] = await Promise.all([
          getAuthConfig(),
          getActivePolicy()
        ]);

        setAuthConfig(configPayload);
        setActivePolicy(policyPayload.activePolicy);

        const token = getStoredToken();

        if (!token) {
          startTransition(() => {
            setScreen("welcome");
          });
          return;
        }

        const sessionPayload = await getCurrentSession(token);

        if (!sessionPayload.authenticated) {
          setStoredToken(null);
          startTransition(() => {
            setScreen("welcome");
          });
          return;
        }

        setSession(sessionPayload);
        setActivePolicy(sessionPayload.activePolicy);

        if (!sessionPayload.hasAcceptedActivePolicy) {
          startTransition(() => {
            setScreen("consent");
          });
          return;
        }

        if (sessionPayload.sessionType === "registered") {
          startTransition(() => {
            setScreen("dashboard");
          });
          return;
        }

        startTransition(() => {
          setScreen("guest");
        });
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setBooting(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      if (screen !== "dashboard" || session?.sessionType !== "registered") {
        return;
      }

      setDashboardBusy(true);
      setDashboardError("");

      try {
        const payload = await getMyStories(getStoredToken());
        setDashboard(payload);
      } catch (loadError) {
        setDashboardError(loadError.message);
      } finally {
        setDashboardBusy(false);
      }
    }

    loadDashboard();
  }, [screen, session]);

  useEffect(() => {
    async function finishGoogleCallback() {
      if (pathname !== "/auth/google/callback") {
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const token = hashParams.get("token");

      if (!token) {
        setError(googleCallbackError || "Google sign-in did not return a session token.");
        return;
      }

      setBusy(true);

      try {
        setStoredToken(token);
        const sessionPayload = await getCurrentSession(token);
        setSession(sessionPayload);
        setActivePolicy(sessionPayload.activePolicy);
        window.history.replaceState({}, "", "/");
        setPathname("/");

        startTransition(() => {
          setScreen(
            sessionPayload.hasAcceptedActivePolicy ? "dashboard" : "consent"
          );
        });
      } catch (callbackError) {
        setStoredToken(null);
        setError(callbackError.message);
      } finally {
        setBusy(false);
      }
    }

    finishGoogleCallback();
  }, [googleCallbackError, pathname]);

  async function handleManualLogin(payload) {
    setBusy(true);
    setError("");

    try {
      const result = await loginManualAccount(payload);
      setStoredToken(result.token);
      setSession(result.session);
      setActivePolicy(result.session.activePolicy);
      startTransition(() => {
        setScreen(result.session.hasAcceptedActivePolicy ? "dashboard" : "consent");
      });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleManualRegister(payload) {
    setBusy(true);
    setError("");

    try {
      const result = await registerManualAccount(payload);
      setStoredToken(result.token);
      setSession(result.session);
      setActivePolicy(result.session.activePolicy);
      startTransition(() => {
        setScreen("consent");
      });
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGuestStart() {
    setBusy(true);
    setError("");

    try {
      const result = await createGuestSession();
      setStoredToken(result.token);
      setSession(result.session);
      setActivePolicy(result.session.activePolicy);
      startTransition(() => {
        setScreen("consent");
      });
    } catch (guestError) {
      setError(guestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAcceptPolicies() {
    setBusy(true);
    setError("");

    try {
      const result = await acceptPolicies(getStoredToken());
      setSession(result.session);
      startTransition(() => {
        setScreen(result.session.sessionType === "registered" ? "dashboard" : "guest");
      });
    } catch (acceptError) {
      setError(acceptError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError("");

    try {
      const token = getStoredToken();

      if (token) {
        await logout(token);
      }
    } catch (_logoutError) {
      // Best-effort logout: clear local session even if revoke fails.
    } finally {
      setStoredToken(null);
      setSession(null);
      setDashboard(null);
      setBusy(false);
      window.history.replaceState({}, "", "/");
      setPathname("/");
      startTransition(() => {
        setScreen("welcome");
      });
    }
  }

  function handleGoogleStart() {
    setError("");
    window.location.assign("/api/auth/google/start");
  }

  if (pathname === "/auth/google/callback") {
    return <GoogleCallbackScreen error={error || googleCallbackError} />;
  }

  if (booting) {
    return (
      <AuthShell
        eyebrow="Loading"
        title="Preparing your space"
        description="Restoring your current session, policy status, and authentication options."
      />
    );
  }

  if (screen === "manual") {
    return (
      <ManualAuthScreen
        mode={manualMode}
        busy={busy}
        error={error}
        onModeChange={setManualMode}
        onBack={() => {
          setError("");
          startTransition(() => {
            setScreen("welcome");
          });
        }}
        onLogin={handleManualLogin}
        onRegister={handleManualRegister}
      />
    );
  }

  if (screen === "consent" && session) {
    return (
      <ConsentScreen
        activePolicy={activePolicy}
        busy={busy}
        error={error}
        sessionType={session.sessionType}
        onAccept={handleAcceptPolicies}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "dashboard" && session) {
    return (
      <RegisteredDashboard
        session={session}
        dashboard={dashboard}
        busy={dashboardBusy}
        error={dashboardError}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "guest" && session) {
    return <GuestSessionScreen onLogout={handleLogout} />;
  }

  return (
    <OnboardingScreen
      googleEnabled={authConfig.googleEnabled}
      message={error}
      onGoogle={handleGoogleStart}
      onManual={() => {
        setError("");
        startTransition(() => {
          setManualMode("login");
          setScreen("manual");
        });
      }}
      onGuest={handleGuestStart}
    />
  );
}

export default App;
