import { AuthShell } from "./AuthShell";
import { InlineNotice } from "./InlineNotice";

export function GoogleCallbackScreen({ error }) {
  return (
    <AuthShell
      eyebrow="Google"
      title={error ? "Google sign-in was interrupted" : "Finishing sign-in"}
      description={
        error
          ? "We couldn't finish the Google sign-in flow."
          : "Hold on while we attach your Google account to a secure MyHaven session."
      }
    >
      <InlineNotice tone={error ? "error" : "info"}>
        {error || "Completing OAuth callback..."}
      </InlineNotice>
    </AuthShell>
  );
}
