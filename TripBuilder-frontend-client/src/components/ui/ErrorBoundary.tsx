import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Đã xảy ra lỗi không mong muốn',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-6">
          <div className="flagship-card max-w-md w-full p-6 space-y-4 text-center">
            <h1 className="text-xl font-semibold text-ink">Trang gặp sự cố hiển thị</h1>
            <p className="text-sm text-ink-2">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn-primary w-full justify-center"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
