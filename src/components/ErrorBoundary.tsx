
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px] border border-red-200 rounded-lg bg-red-50">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Ocorreu um problema</h2>
          <p className="text-gray-600 mb-4 text-center">
            Encontramos um erro ao renderizar este componente.
          </p>
          {error && (
            <div className="bg-red-100 p-4 rounded mb-4 w-full max-w-lg overflow-auto">
              <code className="text-sm text-red-800 whitespace-pre-wrap">{error.toString()}</code>
            </div>
          )}
          <Button onClick={this.handleReset} variant="outline" className="flex items-center gap-2">
            <ReloadIcon className="w-4 h-4" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
