import { startTransition, useEffect, useMemo, useState } from "react";
import {
  acceptPolicies,
  createGuestSession,
  createStory,
  deleteStory,
  getActivePolicy,
  getAuthConfig,
  getCurrentSession,
  getMyStories,
  getStories,
  getStory,
  loginManualAccount,
  logout,
  registerManualAccount,
  runStoryPrivacyCheck,
  sendStoryHug,
  updateStory
} from "./lib/api";
import {
  formatHugLabel,
  formatRelativeTime,
  formatShortDate,
  formatSupportActionLabel
} from "./lib/storyFormatting";
import { ConsentScreen } from "./components/auth/ConsentScreen";
import { AuthShell } from "./components/auth/AuthShell";
import { GoogleCallbackScreen } from "./components/auth/GoogleCallbackScreen";
import { ManualAuthScreen } from "./components/auth/ManualAuthScreen";
import { OnboardingScreen } from "./components/onboarding/OnboardingScreen";
import { MyStoriesScreen } from "./components/story/MyStoriesScreen";
import { StoryFeedScreen } from "./components/story/StoryFeedScreen";
import { StoryFrame } from "./components/story/StoryFrame";
import { StoryReadScreen } from "./components/story/StoryReadScreen";
import { StoryWriteScreen } from "./components/story/StoryWriteScreen";

const sessionTokenStorageKey = "myhaven.session.token";
const storyMinimumLength = 24;
const defaultPrivacyMessage =
  "Your story will be scanned to ensure no identifying details are revealed.";
const dashboardGradients = [
  ["#EBE3F0", "#B8AED0"],
  ["#F2E6D8", "#C2A88F"],
  ["#D9E6DA", "#A3C8B0"],
  ["#DDEAF8", "#8DB7D7"]
];

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

function decorateDashboardStories(stories) {
  return stories.map((story, index) => {
    const [gradientFrom, gradientTo] =
      dashboardGradients[index % dashboardGradients.length];

    return {
      ...story,
      gradientFrom,
      gradientTo,
      dateLabel: formatShortDate(story.publishedAt),
      hugsLabel: formatHugLabel(story.hugCount)
    };
  });
}

function StoryStateFrame({ title, description, actionLabel = "Back", onAction }) {
  return (
    <StoryFrame>
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>
        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-8 rounded-full bg-[#78A6C8] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(120,166,200,0.28)] transition hover:bg-[#6894b5]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </StoryFrame>
  );
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
  const [pathname, setPathname] = useState(window.location.pathname);
  const [feed, setFeed] = useState([]);
  const [feedBusy, setFeedBusy] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [feedEmptyState, setFeedEmptyState] = useState(
    "No stories have been shared yet. Your reflection could be the first."
  );
  const [dashboard, setDashboard] = useState(null);
  const [dashboardBusy, setDashboardBusy] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyBusy, setStoryBusy] = useState(false);
  const [storyError, setStoryError] = useState("");
  const [storyBackTarget, setStoryBackTarget] = useState("home");
  const [editorMode, setEditorMode] = useState("create");
  const [editorReturnScreen, setEditorReturnScreen] = useState("home");
  const [editorStoryId, setEditorStoryId] = useState(null);
  const [editorDraft, setEditorDraft] = useState("");
  const [editorBusy, setEditorBusy] = useState(false);
  const [editorCheckBusy, setEditorCheckBusy] = useState(false);
  const [editorCheckedBody, setEditorCheckedBody] = useState("");
  const [editorScan, setEditorScan] = useState(null);
  const [editorError, setEditorError] = useState("");
  const [storyRefreshKey, setStoryRefreshKey] = useState(0);

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

        startTransition(() => {
          setScreen("home");
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
    async function loadFeed() {
      if (!session?.hasAcceptedActivePolicy) {
        return;
      }

      setFeedBusy(true);
      setFeedError("");

      try {
        const payload = await getStories(getStoredToken());
        setFeed(payload.stories || []);
        setFeedEmptyState(
          payload.emptyState ||
            "No stories have been shared yet. Your reflection could be the first."
        );
      } catch (loadError) {
        setFeedError(loadError.message);
      } finally {
        setFeedBusy(false);
      }
    }

    loadFeed();
  }, [session, storyRefreshKey]);

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
  }, [screen, session, storyRefreshKey]);

  useEffect(() => {
    async function loadSelectedStory() {
      if (screen !== "story" || !selectedStoryId) {
        return;
      }

      setStoryBusy(true);
      setStoryError("");

      try {
        const payload = await getStory(selectedStoryId, getStoredToken());
        setSelectedStory(payload.story);
      } catch (loadError) {
        setStoryError(loadError.message);
      } finally {
        setStoryBusy(false);
      }
    }

    loadSelectedStory();
  }, [screen, selectedStoryId, storyRefreshKey]);

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
            sessionPayload.hasAcceptedActivePolicy ? "home" : "consent"
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

  function resetEditorState() {
    setEditorMode("create");
    setEditorReturnScreen("home");
    setEditorStoryId(null);
    setEditorDraft("");
    setEditorBusy(false);
    setEditorCheckBusy(false);
    setEditorCheckedBody("");
    setEditorScan(null);
    setEditorError("");
  }

  async function handleManualLogin(payload) {
    setBusy(true);
    setError("");

    try {
      const result = await loginManualAccount(payload);
      setStoredToken(result.token);
      setSession(result.session);
      setActivePolicy(result.session.activePolicy);
      startTransition(() => {
        setScreen(result.session.hasAcceptedActivePolicy ? "home" : "consent");
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
        setScreen("home");
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
      setFeed([]);
      setDashboard(null);
      setSelectedStoryId(null);
      setSelectedStory(null);
      setStoryError("");
      setDashboardError("");
      setFeedError("");
      resetEditorState();
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

  function openStory(storyId, backTarget) {
    setStoryBackTarget(backTarget);
    setSelectedStoryId(storyId);
    setSelectedStory(null);
    setStoryError("");
    startTransition(() => {
      setScreen("story");
    });
  }

  function openWriter({ mode, story = null, returnScreen = "home" }) {
    setEditorMode(mode);
    setEditorReturnScreen(returnScreen);
    setEditorStoryId(story?.id || null);
    setEditorDraft(story?.body || "");
    setEditorBusy(false);
    setEditorCheckBusy(false);
    setEditorCheckedBody("");
    setEditorScan(null);
    setEditorError("");
    startTransition(() => {
      setScreen("write");
    });
  }

  async function handleEditStory(story, returnScreen) {
    try {
      const storyToEdit =
        story?.body && story.body.length
          ? story
          : (await getStory(story.id, getStoredToken())).story;

      openWriter({
        mode: "edit",
        story: storyToEdit,
        returnScreen
      });
    } catch (loadError) {
      if (screen === "dashboard") {
        setDashboardError(loadError.message);
      } else {
        setStoryError(loadError.message);
      }
    }
  }

  async function handleRunPrivacyCheck() {
    setEditorCheckBusy(true);
    setEditorError("");

    try {
      const payload = await runStoryPrivacyCheck(editorDraft, getStoredToken());
      setEditorScan(payload.scan);
      setEditorCheckedBody(editorDraft);
    } catch (checkError) {
      setEditorError(checkError.message);

      if (checkError.payload?.scan) {
        setEditorScan(checkError.payload.scan);
        setEditorCheckedBody(editorDraft);
      }
    } finally {
      setEditorCheckBusy(false);
    }
  }

  async function handlePublishStory() {
    if (!editorCanPublish) {
      setEditorError("Run the AI anonymity check again before publishing.");
      return;
    }

    setEditorBusy(true);
    setEditorError("");

    try {
      const token = getStoredToken();
      const payload =
        editorMode === "edit"
          ? await updateStory(editorStoryId, editorDraft, token)
          : await createStory(editorDraft, token);

      setSelectedStoryId(payload.story.id);
      setSelectedStory(payload.story);
      setStoryBackTarget(editorReturnScreen);
      setStoryRefreshKey((current) => current + 1);
      resetEditorState();

      startTransition(() => {
        setScreen("story");
      });
    } catch (publishError) {
      setEditorError(publishError.message);

      if (publishError.payload?.scan) {
        setEditorScan(publishError.payload.scan);
        setEditorCheckedBody(editorDraft);
      }
    } finally {
      setEditorBusy(false);
    }
  }

  async function handleDeleteStory(story) {
    if (!window.confirm("Delete this story? This action will remove it from public view.")) {
      return;
    }

    setDashboardError("");

    try {
      await deleteStory(story.id, getStoredToken());
      setStoryRefreshKey((current) => current + 1);

      if (selectedStoryId === story.id) {
        setSelectedStoryId(null);
        setSelectedStory(null);
      }
    } catch (deleteError) {
      setDashboardError(deleteError.message);
    }
  }

  async function handleSendHug() {
    if (!selectedStoryId) {
      return;
    }

    setStoryError("");

    try {
      const payload = await sendStoryHug(selectedStoryId, getStoredToken());
      setSelectedStory(payload.story);
      setStoryRefreshKey((current) => current + 1);
    } catch (hugError) {
      setStoryError(hugError.message);
    }
  }

  function handleBackFromStory() {
    setSelectedStoryId(null);
    setSelectedStory(null);
    setStoryError("");
    startTransition(() => {
      setScreen(storyBackTarget);
    });
  }

  const editorDraftMatchesCheck = editorCheckedBody === editorDraft;
  const editorCanPublish =
    editorDraft.trim().length >= storyMinimumLength &&
    Boolean(editorScan) &&
    editorDraftMatchesCheck &&
    editorScan.status !== "block" &&
    !editorBusy;

  let editorHelperMessage = defaultPrivacyMessage;
  let editorHelperTone = "muted";

  if (editorError) {
    editorHelperMessage = editorError;
    editorHelperTone = "error";
  } else if (editorScan && !editorDraftMatchesCheck) {
    editorHelperMessage =
      "Draft changed. Run the AI anonymity check again before publishing.";
    editorHelperTone = "warning";
  } else if (editorScan) {
    editorHelperMessage = editorScan.summary;
    editorHelperTone =
      editorScan.status === "pass"
        ? "success"
        : editorScan.status === "warning"
          ? "warning"
          : "error";
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

  if (screen === "home" && session) {
    return (
      <StoryFeedScreen
        eyebrow={
          session.sessionType === "registered"
            ? `Welcome, ${session.user.username}`
            : "Guest session"
        }
        title="Shared stories"
        description={
          session.sessionType === "registered"
            ? "Read quietly, write when you are ready, and keep track of your own stories from My Stories."
            : "Read quietly and share anonymously during this guest session."
        }
        stories={feed}
        emptyState={feedEmptyState}
        busy={feedBusy}
        error={feedError}
        secondaryNavLabel={
          session.sessionType === "registered" ? "My Stories" : "Guest"
        }
        secondaryNavDisabled={session.sessionType !== "registered"}
        onOpenStory={(story) => openStory(story.id, "home")}
        onWrite={() =>
          openWriter({
            mode: "create",
            returnScreen: "home"
          })
        }
        onSecondaryNav={
          session.sessionType === "registered"
            ? () =>
                startTransition(() => {
                  setScreen("dashboard");
                })
            : undefined
        }
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "dashboard" && session?.sessionType === "registered") {
    return (
      <MyStoriesScreen
        title="My Haven"
        summaryCount={dashboard?.stories?.length || 0}
        stories={decorateDashboardStories(dashboard?.stories || [])}
        busy={dashboardBusy}
        error={dashboardError}
        emptyStateMessage={
          dashboard?.emptyState ||
          "Your stories will appear here after you publish your first reflection."
        }
        showManagementControls
        onSettings={handleLogout}
        onHome={() => {
          startTransition(() => {
            setScreen("home");
          });
        }}
        onWrite={() =>
          openWriter({
            mode: "create",
            returnScreen: "dashboard"
          })
        }
        onOpenStory={(story) => openStory(story.id, "dashboard")}
        onEditStory={(story) => handleEditStory(story, "dashboard")}
        onDeleteStory={handleDeleteStory}
      />
    );
  }

  if (screen === "story") {
    if (storyBusy && !selectedStory) {
      return (
        <StoryStateFrame
          title="Loading story"
          description="Pulling the latest version of this story into your space."
          actionLabel="Back"
          onAction={handleBackFromStory}
        />
      );
    }

    if (storyError) {
      return (
        <StoryStateFrame
          title="Story unavailable"
          description={storyError}
          actionLabel="Go back"
          onAction={handleBackFromStory}
        />
      );
    }

    if (selectedStory) {
      return (
        <StoryReadScreen
          tag={selectedStory.tagLabel}
          title={selectedStory.title}
          metadata={selectedStory.metadata}
          publishedAt={formatRelativeTime(selectedStory.publishedAt)}
          body={selectedStory.body}
          actionLabel={
            selectedStory.viewerIsAuthor
              ? formatHugLabel(selectedStory.hugCount)
              : formatSupportActionLabel(
                  selectedStory.hugCount,
                  selectedStory.viewerHasHugged
                )
          }
          actionDisabled={!selectedStory.canSendHug}
          onBack={handleBackFromStory}
          onMenu={
            selectedStory.canEdit
              ? () => handleEditStory(selectedStory, storyBackTarget)
              : undefined
          }
          onSendHug={handleSendHug}
        />
      );
    }
  }

  if (screen === "write" && session) {
    return (
      <StoryWriteScreen
        title={editorMode === "edit" ? "Edit Story" : "New Story"}
        value={editorDraft}
        publishLabel={editorMode === "edit" ? "Save" : "Publish"}
        publishEnabled={editorCanPublish}
        publishBusy={editorBusy}
        checkBusy={editorCheckBusy}
        privacyMessage={editorHelperMessage}
        helperTone={editorHelperTone}
        onChange={(nextValue) => {
          setEditorDraft(nextValue);
          setEditorError("");
        }}
        onCancel={() => {
          resetEditorState();
          startTransition(() => {
            setScreen(editorReturnScreen);
          });
        }}
        onPublish={handlePublishStory}
        onCheckPrivacy={handleRunPrivacyCheck}
      />
    );
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
