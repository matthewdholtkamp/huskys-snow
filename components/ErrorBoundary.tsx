import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-red-400 p-8 flex flex-col items-center justify-center font-mono">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Something went wrong.</h1>
          <div className="bg-slate-800 p-6 rounded-lg border border-red-900/50 max-w-4xl w-full overflow-auto shadow-2xl">
            <h2 className="text-xl font-semibold mb-2 text-red-300">Error:</h2>
            <pre className="whitespace-pre-wrap break-words mb-6 text-sm">
              {this.state.error && this.state.error.toString()}
            </pre>

            <h2 className="text-xl font-semibold mb-2 text-red-300">Stack Trace:</h2>
            <details className="cursor-pointer">
                <summary className="text-slate-400 hover:text-slate-200 mb-2">Click to expand</summary>
                <pre className="whitespace-pre-wrap break-words text-xs text-slate-500">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
            </details>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
