import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const isDev = import.meta.env.DEV;

function defaultLandingPath(role: AuthUser["role"] | undefined) {
  return role === "TECHNICIAN" ? "/technician" : "/dashboard";
}

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => {
    const next: { email?: string; password?: string } = {};
    if (!isValidEmail(email)) next.email = "Please enter a valid email address.";
    if (!password.trim()) next.password = "Password is required.";
    return next;
  }, [email, password]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cipherloom.remember-email");
      if (saved) setEmail(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setSubmitError(null);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    void auth
      .login({ email: email.trim().toLowerCase(), password })
      .then(() => {
        try {
          if (remember) localStorage.setItem("cipherloom.remember-email", email.trim().toLowerCase());
          else localStorage.removeItem("cipherloom.remember-email");
        } catch {
          /* ignore storage errors */
        }
        toast({
          title: "Signed in",
          description: "Welcome back. Loading your workspace…",
          variant: "success"
        });
        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
        const fallback = defaultLandingPath(auth.user?.role);
        navigate(from ?? fallback, { replace: true });
      })
      .catch((error: unknown) => {
        toast({
          title: "Sign in failed",
          description:
            error instanceof ApiError ? error.message : "Please check your credentials and try again.",
          variant: "destructive"
        });
        if (error instanceof ApiError) {
          setSubmitError(error.message || "Login failed. Please try again.");
          return;
        }
        if (error instanceof Error) {
          setSubmitError(error.message);
          return;
        }
        setSubmitError("Login failed. Please try again.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (!auth.isLoading && auth.isAuthenticated) {
    return <Navigate to={defaultLandingPath(auth.user?.role)} replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% -30%, rgba(59,130,246,0.22), transparent 50%), radial-gradient(ellipse 60% 50% at 100% 50%, rgba(139,92,246,0.08), transparent 45%)"
        }}
      />
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/90">
            Cipherloom
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            Technician CRM
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            The operations workspace for dispatchers and service managers — scheduling,
            billing, and field coordination in one calm, fast surface.
          </p>
        </div>

        <Card className="space-y-6 border-border/60 shadow-surface-lg ring-1 ring-primary/10">
          <div className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your organization account to continue.</CardDescription>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Work email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-11 border-border/90 bg-background/50"
              />
              {submitted && errors.email ? <p className="text-xs text-red-400">{errors.email}</p> : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <span className="text-xs text-muted-foreground">Forgot password?</span>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 border-border/90 bg-background/50 pr-[4.25rem]"
                />
                <button
                  type="button"
                  className={cn(
                    "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1.5",
                    "text-xs font-medium text-muted-foreground hover:bg-muted/90 hover:text-foreground"
                  )}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {submitted && errors.password ? (
                <p className="text-xs text-red-400">{errors.password}</p>
              ) : null}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border accent-primary"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember email on this device
            </label>

            {submitError ? <p className="text-xs text-red-400">{submitError}</p> : null}

            <Button className="h-11 w-full text-base font-semibold shadow-glow" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Continue to dashboard"}
            </Button>
          </form>

          {isDev ? (
            <div className="rounded-lg border border-dashed border-primary/25 bg-primary/5 px-3 py-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground/90">Development demo accounts</p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed">
                admin@cipherloom.local / staff@cipherloom.local — password{" "}
                <span className="text-foreground/80">CipherloomDemo#2026</span>
              </p>
            </div>
          ) : null}

          <p className="text-center text-xs text-muted-foreground">
            After sign-in you’ll return to the page you were trying to open, if any.
          </p>
        </Card>

        <p className="mt-8 text-center text-[11px] text-muted-foreground/80">
          © Cipherloom — internal operations software
        </p>
      </div>
    </div>
  );
}
