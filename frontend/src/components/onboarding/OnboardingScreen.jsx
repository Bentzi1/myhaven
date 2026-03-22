import { ActionButton } from "./ActionButton";
import { BrandMark } from "./BrandMark";
import { AnonymousIcon, GoogleIcon, MailIcon } from "./Icons";
import { PhoneFrame } from "./PhoneFrame";

export function OnboardingScreen({
  googleEnabled,
  message,
  onGoogle,
  onManual,
  onGuest
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <PhoneFrame>
        <BrandMark />

        <section className="z-10 mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#78A6C8]">
            Haven
          </h1>
          <p className="text-base leading-relaxed text-slate-500">
            A safe, anonymous space.
            <br />
            Share your stories, release the weight.
          </p>
        </section>

        <section className="z-10 w-full space-y-4">
          {message ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {message}
            </div>
          ) : null}
          <ActionButton
            icon={<GoogleIcon className="h-5 w-5" />}
            onClick={onGoogle}
            disabled={!googleEnabled}
          >
            Enter quietly with Google
          </ActionButton>
          <ActionButton
            variant="primary"
            icon={<MailIcon className="h-5 w-5" />}
            onClick={onManual}
          >
            Enter with Email
          </ActionButton>
          <ActionButton
            variant="tertiary"
            icon={<AnonymousIcon className="h-5 w-5" />}
            onClick={onGuest}
          >
            Continue anonymously
          </ActionButton>
          <p className="px-3 text-center text-xs leading-5 text-slate-500">
            {googleEnabled
              ? "Google, email, and anonymous guest sessions are available from this entry point."
              : "Google sign-in needs local OAuth credentials first. Email and anonymous access are fully available now."}
          </p>
        </section>
      </PhoneFrame>
    </main>
  );
}
