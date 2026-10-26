import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password | GariSoko" },
      { name: "description", content: "Choose a new password for your GariSoko account." },
      { property: "og:title", content: "Set a new password | GariSoko" },
      { property: "og:description", content: "Choose a new password for your GariSoko account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const isRecovery = typeof window !== "undefined" && window.location.hash.includes("type=recovery");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Password updated. You're signed in.");
    await navigate({ to: "/" });
  };

  if (!isRecovery && !done) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-foreground">This link has expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Password reset links are single-use. Request a new one from the sign-in page.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring/40 focus:ring-2"
          />
          <input
            required
            minLength={6}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring/40 focus:ring-2"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
