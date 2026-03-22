import { PhoneFrame } from "../onboarding/PhoneFrame";

export function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <PhoneFrame>
        <section className="w-full">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#78A6C8]">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>
        </section>

        <section className="mt-10 w-full">{children}</section>

        {footer ? <section className="mt-8 w-full">{footer}</section> : null}
      </PhoneFrame>
    </main>
  );
}
