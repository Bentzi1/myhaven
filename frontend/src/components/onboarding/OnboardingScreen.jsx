import { ActionButton } from "./ActionButton";
import { BrandMark } from "./BrandMark";
import { GoogleIcon, MailIcon } from "./Icons";
import { PhoneFrame } from "./PhoneFrame";

export function OnboardingScreen() {
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
          <ActionButton icon={<GoogleIcon className="h-5 w-5" />}>
            Enter quietly with Google
          </ActionButton>
          <ActionButton
            variant="primary"
            icon={<MailIcon className="h-5 w-5" />}
          >
            Enter with Email
          </ActionButton>
        </section>
      </PhoneFrame>
    </main>
  );
}
