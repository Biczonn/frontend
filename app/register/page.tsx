"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { AuthLayout, AuthPageSkeleton } from "@/components/auth/auth-layout";
import { PasswordField } from "@/components/auth/password-field";

export default function RegisterPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: false });
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ username: false, password: false });
  const [edited, setEdited] = useState({ username: false, password: false });
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isChecking) return <AuthPageSkeleton />;

  const usernameError = touched.username && !username.trim() ? "Username is required. Choose a username." : "";
  const passwordError = touched.password && !password ? "Password is required. Choose a password." : "";

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ username: true, password: true });
    setError("");
    setAnnouncement("");

    const usernameInvalid = !username.trim();
    const passwordInvalid = !password;
    if (usernameInvalid || passwordInvalid) {
      window.setTimeout(() => {
        (usernameInvalid ? usernameRef.current : passwordRef.current)?.focus();
      }, 0);
      return;
    }

    setLoading(true);
    try {
      await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      router.push(CONFIG.ROUTES.LOGIN);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn’t create your account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Get started</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Set up your account to access the school portal.
        </p>

        <form onSubmit={handleRegister} noValidate className="mt-8 space-y-5">
          <p className="sr-only" aria-live="polite">{announcement}</p>
          {error && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-slate-800">
              Username
              <span aria-hidden="true" className="ml-0.5 text-slate-400">*</span>
            </label>
            <input
              ref={usernameRef}
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setEdited((current) => ({ ...current, username: true }));
                setError("");
                setAnnouncement("");
              }}
              onBlur={() => {
                if (!edited.username) return;
                setTouched((current) => ({ ...current, username: true }));
                setAnnouncement(username.trim() ? "" : "Username is required. Choose a username.");
              }}
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              required
              aria-invalid={usernameError ? "true" : "false"}
              aria-describedby={usernameError ? "username-error" : undefined}
              className={`hover-border h-12 w-full rounded-lg border bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-500/70 focus-visible:ring-offset-1 ${
                usernameError ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-slate-500"
              }`}
            />
            {usernameError && (
              <p id="username-error" className="text-xs text-rose-700">{usernameError}</p>
            )}
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setEdited((current) => ({ ...current, password: true }));
              setError("");
              setAnnouncement("");
            }}
            onBlur={() => {
              if (!edited.password) return;
              setTouched((current) => ({ ...current, password: true }));
              setAnnouncement(password ? "" : "Password is required. Choose a password.");
            }}
            autoComplete="new-password"
            inputRef={passwordRef}
            error={passwordError}
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
          >
            {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href={CONFIG.ROUTES.LOGIN} className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
