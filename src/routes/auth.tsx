import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | GariSoko" },
      { name: "description", content: "Sign in or create a GariSoko account to sell your car in Kenya." },
      { property: "og:title", content: "Sign in | GariSoko" },
      { property: "og:description", content: "Sign in or create a GariSoko account to sell your car." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const inputCls =
    "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring/40 focus:ring-2";

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await navigate({ to: "/" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() || undefined },
        emailRedirectTo: window.location.origin,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Email confirmation is on: the user is not signed in until they confirm.
    setAwaitingConfirm(true);
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reset link sent — check your email.");
    setMode("signin");
  };

  if (awaitingConfirm) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
          Click it to activate your account, then sign in.
        </p>
        <button
          onClick={() => {
            setAwaitingConfirm(false);
            setMode("signin");
          }}
          className="mt-6 h-11 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h1 className="text-2xl font-bold text-foreground">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "forgot"
            ? "Enter your email and we'll send you a reset link."
            : "Sign in to post cars for sale and manage your listings."}
        </p>

        {mode === "forgot" ? (
          <form className="mt-6 space-y-4" onSubmit={sendReset}>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={inputCls} />
            <button type="submit" disabled={busy} className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">
              {busy ? "Sending..." : "Send reset link"}
            </button>
            <button type="button" onClick={() => setMode("signin")} className="w-full text-sm text-muted-foreground hover:text-foreground">
              Back to sign in
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={mode === "signup" ? signUp : signIn}>
            {mode === "signup" && (
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputCls} />
            )}
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={inputCls} />
            <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputCls} />
            <button type="submit" disabled={busy} className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">
              {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
        )}

        <div className="mt-4 flex flex-col gap-1 text-center text-sm">
          {mode === "signin" && (
            <>
              <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-foreground">
                Forgot your password?
              </button>
              <p className="text-muted-foreground">
                New to GariSoko?{" "}
                <button onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
                  Create an account
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        By continuing you agree to deal fairly. <Link to="/" className="underline">Back to browsing</Link>
      </p>
    </div>
  );
}
