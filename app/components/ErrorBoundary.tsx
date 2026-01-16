/**
 * ErrorBoundary.tsx - React Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the entire application.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 */
"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Optional custom fallback UI to display on error */
  fallback?: ReactNode;
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error (if any) */
  error: Error | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Error Boundary component that catches and handles React errors.
 *
 * Features:
 * - Catches errors in child component tree
 * - Displays user-friendly fallback UI
 * - Provides "Try again" button to reset state
 * - Supports custom fallback UI via prop
 * - Supports error callback for logging/analytics
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Static lifecycle method called when an error is thrown.
   * Updates state to trigger fallback UI render.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called after an error has been thrown.
   * Used for error logging and calling the onError callback.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);

    // Call optional error callback (for analytics, error reporting, etc.)
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Resets the error state, allowing the component tree to re-render.
   * Called when user clicks "Try again" button.
   */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div
          className="rounded-lg border border-red-300 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950"
          role="alert"
        >
          <div className="flex items-start gap-4">
            {/* Error icon */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-200 dark:bg-red-900">
              <svg
                className="h-6 w-6 text-red-700 dark:text-red-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Something went wrong
              </h2>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                An unexpected error occurred while rendering this component.
              </p>

              {/* Show error message in development */}
              {process.env.NODE_ENV === "development" && error && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
                    Show error details
                  </summary>
                  <pre className="mt-2 overflow-x-auto rounded bg-red-100 p-3 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
                    {error.message}
                    {"\n\n"}
                    {error.stack}
                  </pre>
                </details>
              )}

              {/* Reset button */}
              <button
                type="button"
                onClick={this.handleReset}
                className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-offset-red-950"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap any component with an error boundary.
 *
 * @param WrappedComponent - The component to wrap
 * @param fallback - Optional custom fallback UI
 * @returns A new component wrapped in an ErrorBoundary
 *
 * @example
 * const SafeAudioPlayer = withErrorBoundary(AudioPlayer);
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";

  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}
