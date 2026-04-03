import type { PropsWithChildren } from "react";
import { Component } from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/error-reporter";

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<
  PropsWithChildren,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    reportError(error, { area: "react-boundary" });
  }

  private handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-slate-900 p-6 text-slate-100">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-400">
              The app hit an unexpected error. Refresh to recover your session.
            </p>
            <Button className="mt-4 w-full" onClick={this.handleReload}>
              Reload app
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
