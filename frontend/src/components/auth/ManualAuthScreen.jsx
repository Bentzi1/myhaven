import { useState } from "react";
import { ActionButton } from "../onboarding/ActionButton";
import { AuthShell } from "./AuthShell";
import { InlineNotice } from "./InlineNotice";

const initialRegisterState = {
  username: "",
  email: "",
  password: ""
};

const initialLoginState = {
  email: "",
  password: ""
};

export function ManualAuthScreen({
  mode,
  busy,
  error,
  onModeChange,
  onBack,
  onLogin,
  onRegister
}) {
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [registerForm, setRegisterForm] = useState(initialRegisterState);

  const isLogin = mode === "login";

  async function handleSubmit(event) {
    event.preventDefault();

    if (isLogin) {
      await onLogin(loginForm);
      return;
    }

    await onRegister(registerForm);
  }

  return (
    <AuthShell
      eyebrow="Authentication"
      title={isLogin ? "Welcome back" : "Create your haven"}
      description={
        isLogin
          ? "Use your registered email and password to access My Stories and your private account tools."
          : "Create a registered account with a unique username, your email, and a strong password."
      }
      footer={
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          Back to onboarding
        </button>
      }
    >
      <div className="mb-6 flex rounded-2xl bg-slate-100 p-1">
        {["login", "register"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onModeChange(item)}
            className={`flex-1 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
              mode === item
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {item === "login" ? "Sign In" : "Register"}
          </button>
        ))}
      </div>

      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        {isLogin ? null : (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Username
            </span>
            <input
              value={registerForm.username}
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  username: event.target.value
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#78A6C8] focus:ring-2 focus:ring-[#78A6C8]/20"
              placeholder="quiet_writer"
              autoComplete="username"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Email
          </span>
          <input
            type="email"
            value={isLogin ? loginForm.email : registerForm.email}
            onChange={(event) =>
              isLogin
                ? setLoginForm((current) => ({
                    ...current,
                    email: event.target.value
                  }))
                : setRegisterForm((current) => ({
                    ...current,
                    email: event.target.value
                  }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#78A6C8] focus:ring-2 focus:ring-[#78A6C8]/20"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Password
          </span>
          <input
            type="password"
            value={isLogin ? loginForm.password : registerForm.password}
            onChange={(event) =>
              isLogin
                ? setLoginForm((current) => ({
                    ...current,
                    password: event.target.value
                  }))
                : setRegisterForm((current) => ({
                    ...current,
                    password: event.target.value
                  }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#78A6C8] focus:ring-2 focus:ring-[#78A6C8]/20"
            placeholder={isLogin ? "Your password" : "At least 8 chars, with letters and numbers"}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </label>

        <ActionButton type="submit" variant="primary" disabled={busy}>
          {busy ? "Working..." : isLogin ? "Sign In" : "Create Account"}
        </ActionButton>
      </form>
    </AuthShell>
  );
}
