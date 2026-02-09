import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Unhandled render error:", error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-6">
            <div className="max-w-lg text-center bg-white/90 rounded-2xl shadow-xl p-8 border border-pink-100">
              <h1 className="text-2xl font-bold text-gray-800 mb-3">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                The app hit an unexpected error. Please refresh and try again.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  className="px-4 py-2 rounded-lg bg-pink-500 text-white font-semibold"
                  onClick={() => window.location.reload()}
                >
                  Reload
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold"
                  onClick={() => (window.location.href = "/login")}
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
