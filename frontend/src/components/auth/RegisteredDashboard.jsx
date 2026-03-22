import { ActionButton } from "../onboarding/ActionButton";
import { AuthShell } from "./AuthShell";
import { InlineNotice } from "./InlineNotice";

export function RegisteredDashboard({
  session,
  dashboard,
  busy,
  error,
  onLogout
}) {
  return (
    <AuthShell
      eyebrow="My Stories"
      title={`Welcome, ${session?.user?.username}`}
      description="Registered users can access My Stories, unread comment counts, and story management from here."
      footer={
        <button
          type="button"
          onClick={onLogout}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          Log out
        </button>
      }
    >
      <div className="space-y-4">
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}

        <nav className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-4 text-left shadow-sm"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-800">
                My Stories
              </span>
              <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-slate-400">
                Registered navigation
              </span>
            </span>
            <span className="rounded-full bg-[#78A6C8] px-3 py-1 text-sm font-semibold text-white">
              {dashboard?.unreadCommentCount ?? 0}
            </span>
          </button>
        </nav>

        <div className="rounded-3xl bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#78A6C8]">
                Account
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-800">
                {session?.user?.email}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Unread comments
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {dashboard?.unreadCommentCount ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Story inventory
          </h2>
          {busy ? (
            <p className="mt-4 text-sm text-slate-500">Loading your dashboard...</p>
          ) : dashboard?.stories?.length ? (
            <ul className="mt-4 space-y-3">
              {dashboard.stories.map((story) => (
                <li
                  key={story.id}
                  className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-600"
                >
                  {story.title}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-2xl bg-white px-4 py-4 text-sm leading-6 text-slate-600">
              {dashboard?.emptyState ||
                "No stories yet. This dashboard is ready for story ownership once publishing is connected."}
            </div>
          )}
        </div>

        <InlineNotice tone="info">
          Edit and delete controls are reserved for registered users and will activate as
          soon as story management endpoints are added.
        </InlineNotice>

        <ActionButton variant="secondary" onClick={onLogout}>
          End session
        </ActionButton>
      </div>
    </AuthShell>
  );
}
