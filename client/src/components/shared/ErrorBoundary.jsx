import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Universal React 19 Error Boundary Component.
 * Catches unhandled JavaScript render exceptions, prevents full white-screen crashes,
 * logs stack traces in development, and displays a recovery UI with clear navigation options.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary Caught Exception]:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-6 font-sans text-slate-100">
          <div className="flex w-full max-w-lg flex-col items-center space-y-6 rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-400">
              <AlertTriangle className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
                Something Went Wrong
              </h1>
              <p className="text-sm leading-relaxed text-slate-400">
                An unexpected error occurred while rendering this component. Our telemetry engine
                has captured the error details.
              </p>
            </div>

            {this.state.error && (
              <div className="max-h-40 w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-left">
                <p className="break-all font-mono text-xs font-bold text-rose-300">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex w-full flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
              >
                <RefreshCw className="h-4 w-4" /> Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-slate-700"
              >
                Full Reload
              </button>
              <a
                href="/"
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 transition-colors hover:border-slate-600"
              >
                <Home className="h-4 w-4" /> Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
