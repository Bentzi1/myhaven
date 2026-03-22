import { ActionButton } from "../onboarding/ActionButton";
import { AuthShell } from "./AuthShell";
import { InlineNotice } from "./InlineNotice";

export function GuestSessionScreen({ onLogout }) {
  return (
    <AuthShell
      eyebrow="Guest Session"
      title="Anonymous access is active"
      description="You can continue anonymously for this session, but My Stories and cross-session account recovery stay unavailable by design."
      footer={
        <button
          type="button"
          onClick={onLogout}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          End guest session
        </button>
      }
    >
      <div className="space-y-4">
        <InlineNotice tone="info">
          This session satisfies the product rule that anonymous users can read and
          share content only after accepting the current policy version.
        </InlineNotice>

        <div className="rounded-3xl bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Session limits
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li className="rounded-2xl bg-slate-50 px-4 py-3">
              This guest session has no My Stories access.
            </li>
            <li className="rounded-2xl bg-slate-50 px-4 py-3">
              Story ownership does not persist after logout or session expiry.
            </li>
            <li className="rounded-2xl bg-slate-50 px-4 py-3">
              A fresh policy approval is required for every new anonymous session.
            </li>
          </ul>
        </div>

        <ActionButton variant="secondary" onClick={onLogout}>
          Return to onboarding
        </ActionButton>
      </div>
    </AuthShell>
  );
}
