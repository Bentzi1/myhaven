import { useState } from "react";
import { ActionButton } from "../onboarding/ActionButton";
import { AuthShell } from "./AuthShell";
import { InlineNotice } from "./InlineNotice";

export function ConsentScreen({
  activePolicy,
  busy,
  error,
  sessionType,
  onAccept,
  onLogout
}) {
  const [accepted, setAccepted] = useState(false);

  return (
    <AuthShell
      eyebrow="Consent"
      title="Before you share"
      description="We need explicit policy acceptance before posting. Anonymous sessions must re-accept each time they start."
      footer={
        <button
          type="button"
          onClick={onLogout}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          Leave this session
        </button>
      }
    >
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}

      <div className="space-y-4">
        <div className="rounded-3xl bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#78A6C8]">
            Active policy
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-800">
            {activePolicy?.versionLabel}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {activePolicy?.pilotStatus}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Terms of Service
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            {activePolicy?.termsOfService?.map((item) => (
              <li key={item} className="rounded-2xl bg-white px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Privacy highlights
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            {activePolicy?.privacyHighlights?.map((item) => (
              <li key={item} className="rounded-2xl bg-white px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#78A6C8] focus:ring-[#78A6C8]"
          />
          <span>
            I understand the pilot status, privacy policy, and posting rules for this{" "}
            {sessionType === "guest" ? "guest session" : "account"}.
          </span>
        </label>

        <ActionButton
          variant="primary"
          onClick={onAccept}
          disabled={!accepted || busy}
        >
          {busy ? "Saving consent..." : "Accept and continue"}
        </ActionButton>
      </div>
    </AuthShell>
  );
}
